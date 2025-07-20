import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Octokit } from "@octokit/rest";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import treeify from "treeify";
import { getR2Client, getR2Config } from "@/lib/r2Client";

// Supported file extensions
const SUPPORTED_EXTENSIONS = [
  ".js",
  ".py",
  ".java",
  ".cpp",
  ".html",
  ".css",
  ".ts",
  ".jsx",
  ".tsx",
  ".md",
  ".go",
];

// Max file size (1MB per file)
const MAX_FILE_SIZE = 1024 * 1024;

interface GitHubFile {
  path: string;
  content: string;
  size: number;
}

interface GitHubImportRequest {
  repoUrl: string;
  selectedFiles: string[];
  branch?: string;
}

interface GitHubImportResponse {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  totalFiles?: number;
  totalSize?: number;
  error?: string;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);

    if (pathParts.length < 2) {
      throw new Error("Invalid GitHub URL format");
    }

    const [owner, repo] = pathParts;
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch (err) {
    throw new Error("Invalid GitHub URL format");
  }
}

function shouldIncludeFile(path: string, selectedFiles?: string[]): boolean {
  if (selectedFiles) {
    return selectedFiles.includes(path);
  }
  const ext = path.substring(path.lastIndexOf("."));
  return SUPPORTED_EXTENSIONS.includes(ext);
}

function generateFolderStructure(files: GitHubFile[]): string {
  const tree: any = {};

  // Sort files by depth (level) and then alphabetically
  const sortedFiles = files.sort((a, b) => {
    const aDepth = a.path.split("/").length;
    const bDepth = b.path.split("/").length;

    if (aDepth !== bDepth) {
      return aDepth - bDepth; // Sort by depth first
    }

    return a.path.localeCompare(b.path); // Then alphabetically
  });

  sortedFiles.forEach((file) => {
    const parts = file.path.split("/");
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // It's a file
        current[part] = null;
      } else {
        // It's a directory
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  });

  return treeify.asTree(tree, true, true);
}

async function fetchGitHubFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  selectedFiles?: string[],
  branch?: string
): Promise<GitHubFile[]> {
  try {
    // Get the default branch if none specified
    if (!branch) {
      const repoInfo = await octokit.rest.repos.get({ owner, repo });
      branch = repoInfo.data.default_branch;
    }

    // Get the tree recursively
    const tree = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: "true",
    });

    const files: GitHubFile[] = [];
    const filePromises: Promise<void>[] = [];

    // Filter for selected files (or supported file types if no selection)
    const supportedFiles = tree.data.tree.filter(
      (item) =>
        item.type === "blob" && item.path && shouldIncludeFile(item.path, selectedFiles)
    );

    // Fetch file contents in parallel (with some throttling)
    const batchSize = 10;
    for (let i = 0; i < supportedFiles.length; i += batchSize) {
      const batch = supportedFiles.slice(i, i + batchSize);

      const batchPromises = batch.map(async (file) => {
        try {
          if (!file.path || !file.sha) return;

          // Get file content
          const content = await octokit.rest.git.getBlob({
            owner,
            repo,
            file_sha: file.sha,
          });

          // Skip if file is too large
          if (file.size && file.size > MAX_FILE_SIZE) {
            return;
          }

          // Decode content
          const decodedContent = Buffer.from(
            content.data.content,
            "base64"
          ).toString("utf-8");

          files.push({
            path: file.path,
            content: decodedContent,
            size: file.size || 0,
          });
        } catch (error) {
          console.error(`Error fetching file ${file.path}:`, error);
          // Continue with other files
        }
      });

      await Promise.all(batchPromises);
    }

    return files;
  } catch (error) {
    console.error("Error fetching GitHub files:", error);
    throw error;
  }
}

async function uploadToR2(content: string, fileName: string): Promise<string> {
  const { bucketName, publicUrl } = getR2Config();
  const s3Client = getR2Client();
  const key = `github/${fileName}`;

  const uploadCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: content,
    ContentType: "text/plain",
  });

  await s3Client.send(uploadCommand);

  return `${publicUrl}/${key}`;
}

function formatRepositoryContent(
  owner: string,
  repo: string,
  branch: string,
  files: GitHubFile[]
): string {
  const folderStructure = generateFolderStructure(files);

  let content = `# GitHub Repository: ${owner}/${repo} (${branch})\n\n`;
  content += `## Folder Structure\n\n\`\`\`\n${folderStructure}\`\`\`\n\n`;
  content += `## Files (${files.length} total)\n\n`;

  // Sort files by depth (level) and then alphabetically for content display
  const sortedFiles = files.sort((a, b) => {
    const aDepth = a.path.split("/").length;
    const bDepth = b.path.split("/").length;

    if (aDepth !== bDepth) {
      return aDepth - bDepth; // Sort by depth first
    }

    return a.path.localeCompare(b.path); // Then alphabetically
  });

  sortedFiles.forEach((file, index) => {
    content += `### ${file.path}\n\n`;
    content += `\`\`\`\n${file.content}\n\`\`\`\n\n`;

    if (index < sortedFiles.length - 1) {
      content += "---\n\n";
    }
  });

  return content;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<GitHubImportResponse>> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Check GitHub PAT
    const GITHUB_PAT = process.env.GITHUB_PAT;
    if (!GITHUB_PAT) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub Personal Access Token not configured",
        },
        { status: 500 }
      );
    }

    // Parse request
    const { repoUrl, selectedFiles, branch }: GitHubImportRequest = await req.json();

    if (!repoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository URL is required",
        },
        { status: 400 }
      );
    }

    if (!selectedFiles || selectedFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one file must be selected",
        },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    const { owner, repo } = parseGitHubUrl(repoUrl);

    // Initialize Octokit
    const octokit = new Octokit({
      auth: GITHUB_PAT,
    });

    // Fetch repository files
    const files = await fetchGitHubFiles(octokit, owner, repo, selectedFiles, branch);

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No selected files found in repository",
        },
        { status: 404 }
      );
    }

    // Get actual branch name (in case it was auto-detected)
    const repoInfo = await octokit.rest.repos.get({ owner, repo });
    const actualBranch = branch || repoInfo.data.default_branch;

    // Format content
    const formattedContent = formatRepositoryContent(
      owner,
      repo,
      actualBranch,
      files
    );

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${owner}-${repo}-${actualBranch}-${timestamp}.txt`;

    // Upload to R2
    const fileUrl = await uploadToR2(formattedContent, fileName);

    // Calculate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
      totalFiles: files.length,
      totalSize,
    });
  } catch (error) {
    console.error("GitHub import error:", error);

    let errorMessage = "Failed to import repository";

    if (error instanceof Error) {
      if (error.message.includes("Not Found")) {
        errorMessage = "Repository not found or not accessible";
      } else if (error.message.includes("rate limit")) {
        errorMessage =
          "GitHub API rate limit exceeded. Please try again later.";
      } else if (error.message.includes("Invalid GitHub URL")) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
