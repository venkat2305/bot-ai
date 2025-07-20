import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Octokit } from "@octokit/rest";

interface GitHubStructureRequest {
  repoUrl: string;
  branch?: string;
}

interface FileTreeItem {
  path: string;
  type: 'file' | 'directory';
  size?: number;
  isSupported?: boolean;
  children?: FileTreeItem[];
}

interface GitHubStructureResponse {
  success: boolean;
  structure?: FileTreeItem[];
  defaultBranch?: string;
  error?: string;
}

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
  ".c",
  ".h",
  ".php",
  ".rb",
  ".swift",
  ".kt",
  ".rs",
  ".vue",
  ".svelte",
  ".json",
  ".xml",
  ".yaml",
  ".yml",
  ".sql",
  ".sh",
  ".bat",
  ".ps1",
];

// Files and patterns to exclude by default (not auto-selected)
const EXCLUDED_FILES = [
  "tsconfig.json",
  "tsconfig.tsbuildinfo",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
  "tailwind.config.js",
  "tailwind.config.ts",
  "postcss.config.js",
  "webpack.config.js",
  "vite.config.js",
  "vite.config.ts",
  "rollup.config.js",
  "babel.config.js",
  ".eslintrc.js",
  ".eslintrc.json",
  ".prettierrc",
  ".gitignore",
  ".dockerignore",
  "dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
];

// Folder patterns to exclude
const EXCLUDED_FOLDERS = [
  ".github",
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  ".vscode",
  ".idea",
  "coverage",
  ".nyc_output",
];

// Large/binary file patterns to exclude
const EXCLUDED_PATTERNS = [
  /\.min\.(js|css)$/,
  /\.map$/,
  /\.lock$/,
  /\.log$/,
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
  /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/,
  /\.(zip|tar|gz|rar|7z)$/,
  /\.(mp4|mp3|wav|avi|mov)$/,
  /\.d\.ts$/,
];

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

function isFileSupported(path: string): boolean {
  const ext = path.substring(path.lastIndexOf("."));
  return SUPPORTED_EXTENSIONS.includes(ext);
}

function shouldExcludeFile(path: string): boolean {
  const fileName = path.split('/').pop()?.toLowerCase() || '';
  const folderPath = path.split('/').slice(0, -1).join('/');
  
  // Check if file is in excluded files list
  if (EXCLUDED_FILES.some(excludedFile => fileName === excludedFile.toLowerCase())) {
    return true;
  }
  
  // Check if file is in excluded folder
  if (EXCLUDED_FOLDERS.some(excludedFolder => 
    folderPath.split('/').some(folder => folder.toLowerCase() === excludedFolder.toLowerCase())
  )) {
    return true;
  }
  
  // Check if file matches excluded patterns
  if (EXCLUDED_PATTERNS.some(pattern => pattern.test(fileName))) {
    return true;
  }
  
  return false;
}

function buildFileTree(items: any[]): FileTreeItem[] {
  const tree: { [key: string]: FileTreeItem } = {};
  const directories = new Set<string>();

  // First pass: create all directories
  items.forEach(item => {
    if (item.type === "tree") {
      directories.add(item.path);
      const parts = item.path.split("/");
      let currentPath = "";
      
      parts.forEach((part: string, index: number) => {
        currentPath = index === 0 ? part : `${currentPath}/${part}`;
        if (!tree[currentPath]) {
          tree[currentPath] = {
            path: currentPath,
            type: "directory",
            children: []
          };
        }
      });
    }
  });

  // Second pass: add files
  items.forEach(item => {
    if (item.type === "blob") {
      const filePath = item.path;
      const isSupported = isFileSupported(filePath) && !shouldExcludeFile(filePath);
      
      tree[filePath] = {
        path: filePath,
        type: "file",
        size: item.size || 0,
        isSupported
      };

      // Add to parent directory
      const parentPath = filePath.substring(0, filePath.lastIndexOf("/"));
      if (parentPath && tree[parentPath]) {
        tree[parentPath].children = tree[parentPath].children || [];
        tree[parentPath].children.push(tree[filePath]);
      }
    }
  });

  // Third pass: nest directories properly
  Object.values(tree).forEach(item => {
    if (item.type === "directory") {
      const parentPath = item.path.substring(0, item.path.lastIndexOf("/"));
      if (parentPath && tree[parentPath]) {
        tree[parentPath].children = tree[parentPath].children || [];
        // Only add if not already added
        if (!tree[parentPath].children?.some(child => child.path === item.path)) {
          tree[parentPath].children.push(item);
        }
      }
    }
  });

  // Return root level items (items without parent or parent not in tree)
  const rootItems = Object.values(tree).filter(item => {
    const parentPath = item.path.substring(0, item.path.lastIndexOf("/"));
    return !parentPath || !tree[parentPath];
  });

  // Sort items: directories first, then files, both alphabetically
  const sortItems = (items: FileTreeItem[]): FileTreeItem[] => {
    return items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.path.localeCompare(b.path);
    }).map(item => ({
      ...item,
      children: item.children ? sortItems(item.children) : undefined
    }));
  };

  return sortItems(rootItems);
}

async function fetchGitHubStructure(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch?: string
): Promise<{ structure: FileTreeItem[]; defaultBranch: string }> {
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

    const structure = buildFileTree(tree.data.tree);

    return { structure, defaultBranch: branch };
  } catch (error) {
    console.error("Error fetching GitHub structure:", error);
    throw error;
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<GitHubStructureResponse>> {
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
    const { repoUrl, branch }: GitHubStructureRequest = await req.json();

    if (!repoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository URL is required",
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

    // Fetch repository structure
    const { structure, defaultBranch } = await fetchGitHubStructure(octokit, owner, repo, branch);

    return NextResponse.json({
      success: true,
      structure,
      defaultBranch,
    });
  } catch (error) {
    console.error("GitHub structure fetch error:", error);

    let errorMessage = "Failed to fetch repository structure";

    if (error instanceof Error) {
      if (error.message.includes("Not Found")) {
        errorMessage = "Repository not found or not accessible";
      } else if (error.message.includes("rate limit")) {
        errorMessage = "GitHub API rate limit exceeded. Please try again later.";
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