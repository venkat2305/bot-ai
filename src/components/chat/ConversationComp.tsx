import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, easeInOut } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Brain,
  User,
  Bot,
  ClipboardCopy,
  Check,
  Github,
  FileText,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";
import { ImageAttachment, GitHubAttachment } from "@/types/chat";

const parseReasoningContent = (
  content: string,
  isStreaming: boolean = false
) => {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
  const matches = [];
  let match;

  while ((match = thinkRegex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }

  // Handle incomplete reasoning during streaming
  if (
    isStreaming &&
    content.includes("<think>") &&
    !content.includes("</think>")
  ) {
    const incompleteMatch = content.match(/<think>([\s\S]*)$/);
    if (incompleteMatch) {
      matches.push(incompleteMatch[1].trim());
    }
  }

  let reasoningContent = matches.join("\n\n");

  // Clean up any residual tags from the reasoning content itself.
  reasoningContent = reasoningContent.replace(/<\/?think>/g, "").trim();

  // A more aggressive cleanup for mainContent.
  // This removes complete <think> blocks AND any stray <think> or </think> tags.
  const mainContent = content
    .replace(/<think>[\s\S]*?<\/think>/g, "") // Remove complete blocks
    .replace(/<\/?think>/g, "") // Remove any stray/remaining tags
    .trim();

  return {
    reasoningContent: reasoningContent || null,
    // Fallback to the original content only if mainContent is empty,
    // but this is less likely to be needed now.
    mainContent:
      mainContent ||
      (isStreaming ? null : content.replace(/<\/?think>/g, "").trim()),
  };
};

interface ConversationCompProps {
  role: "user" | "assistant";
  content: string;
  images?: ImageAttachment[];
  githubAttachment?: GitHubAttachment;
  isStreaming?: boolean;
  isReasoningModel?: boolean;
  reasoningContent?: string;
  mainContent?: string;
  hasActiveReasoning?: boolean;
}

// Extract constants
const COPY_TIMEOUT = 3000;
const ANIMATION_DURATION = 0.2;

// Animation variants
const messageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const reasoningVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
};

const cursorVariants = {
  animate: {
    opacity: [0.5, 1, 0.5],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: easeInOut,
  },
};

// Separate components for better organization
const Avatar: React.FC<{ isUser: boolean }> = ({ isUser }) => (
  <div className="flex-shrink-0">
    <div
      className={clsx(
        "w-10 h-10 rounded-full p-2 shadow-sm border",
        isUser
          ? "bg-gradient-to-br from-blue-500 to-purple-600 border-blue-200"
          : "bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] border-[var(--border-color)]"
      )}
    >
      {isUser ? (
        <User className="w-full h-full text-white" />
      ) : (
        <Bot className="w-full h-full text-white" />
      )}
    </div>
  </div>
);

const CopyButton: React.FC<{
  content: string;
  copied: boolean;
  onCopy: () => void;
}> = ({ content, copied, onCopy }) => (
  <button
    onClick={onCopy}
    className="mt-2 text-xs text-[var(--text-secondary)] hover:text-[var(--primary-color)] flex items-center gap-1 transition-colors"
    aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
  >
    {copied ? (
      <>
        <Check className="w-3 h-3" />
        Copied!
      </>
    ) : (
      <>
        <ClipboardCopy className="w-3 h-3" />
        Copy
      </>
    )}
  </button>
);

const StreamingCursor: React.FC = () => (
  <motion.span
    variants={cursorVariants}
    animate="animate"
    transition={cursorVariants.transition}
    className="inline-block w-2 h-4 bg-[var(--primary-color)] ml-1"
  />
);

const ReasoningSection: React.FC<{
  reasoningContent: string;
  showReasoning: boolean;
  onToggle: () => void;
  isStreaming: boolean;
  hasActiveReasoning: boolean;
  isUser: boolean;
}> = ({
  reasoningContent,
  showReasoning,
  onToggle,
  isStreaming,
  hasActiveReasoning,
  isUser,
}) => {
  // Clean the reasoning content of any remaining tags
  const cleanReasoningContent = reasoningContent
    .replace(/<\/?think>/g, "")
    .trim();

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors"
        aria-expanded={showReasoning}
        aria-controls="reasoning-content"
      >
        <Brain className="w-4 h-4" />
        <span>Reasoning Process</span>
        {showReasoning ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {showReasoning && (
          <motion.div
            {...reasoningVariants}
            transition={{ duration: ANIMATION_DURATION }}
            className="mt-3 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]"
            id="reasoning-content"
          >
            <div className="prose prose-sm max-w-none prose-headings:text-[var(--text-secondary)] prose-p:text-[var(--text-secondary)] prose-strong:text-[var(--text-secondary)] prose-code:text-[var(--primary-color)] prose-pre:bg-[var(--card-bg)] prose-pre:border prose-pre:border-[var(--border-color)]">
              <div className="relative">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {cleanReasoningContent}
                </ReactMarkdown>
                {isStreaming && hasActiveReasoning && !isUser && (
                  <StreamingCursor />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MainContent: React.FC<{
  content: string;
  isStreaming: boolean;
  hasActiveReasoning: boolean;
  isUser: boolean;
  onCopy: (text: string) => void;
  copied: boolean;
}> = ({ content, isStreaming, hasActiveReasoning, isUser, onCopy, copied }) => (
  <div className="prose prose-sm max-w-none prose-headings:text-[var(--text-color)] prose-p:text-[var(--text-color)] prose-strong:text-[var(--text-color)] prose-code:text-[var(--primary-color)] prose-pre:bg-[var(--bg-tertiary)] prose-pre:border prose-pre:border-[var(--border-color)] prose-blockquote:border-[var(--primary-color)] prose-blockquote:text-[var(--text-secondary)]">
    <div className="relative">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      {isStreaming && !hasActiveReasoning && !isUser && <StreamingCursor />}
    </div>
    <CopyButton
      content={content}
      copied={copied}
      onCopy={() => onCopy(content)}
    />
  </div>
);

const ImageGallery: React.FC<{ images: ImageAttachment[] }> = ({ images }) => (
  <div className="mb-3 flex flex-wrap gap-2">
    {images.map((image, index) => (
      <div key={index} className="relative group">
        <img
          src={image.url}
          alt={image.filename}
          className="max-w-[200px] max-h-[200px] object-cover rounded-lg border border-[var(--border-color)] shadow-sm"
          onClick={() => window.open(image.url, "_blank")}
          style={{ cursor: "pointer" }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="truncate">{image.filename}</div>
          <div className="text-gray-300">
            {(image.size / 1024).toFixed(1)}KB
          </div>
        </div>
      </div>
    ))}
  </div>
);

const GitHubAttachmentDisplay: React.FC<{
  githubAttachment: GitHubAttachment;
}> = ({ githubAttachment }) => (
  <div className="mb-3 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
    <div className="flex items-center gap-2 mb-2">
      <Github className="w-4 h-4 text-[var(--primary-color)]" />
      <span className="text-sm font-medium text-[var(--text-color)]">
        GitHub Repository
      </span>
    </div>
    <div className="space-y-1 text-xs text-[var(--text-muted)]">
      {githubAttachment.repoUrl && (
        <div className="flex items-center gap-2">
          <span className="font-medium">Repository:</span>
          <a
            href={githubAttachment.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary-color)] hover:underline"
          >
            {githubAttachment.repoUrl.replace("https://github.com/", "")}
          </a>
        </div>
      )}
      {githubAttachment.branch && (
        <div className="flex items-center gap-2">
          <span className="font-medium">Branch:</span>
          <span>{githubAttachment.branch}</span>
        </div>
      )}
      {githubAttachment.totalFiles !== undefined && (
        <div className="flex items-center gap-2">
          <span className="font-medium">Files:</span>
          <span>{githubAttachment.totalFiles} files</span>
        </div>
      )}
      {githubAttachment.totalSize !== undefined && (
        <div className="flex items-center gap-2">
          <span className="font-medium">Size:</span>
          <span>{(githubAttachment.totalSize / 1024).toFixed(1)}KB</span>
        </div>
      )}
    </div>
    {githubAttachment.url && (
      <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
        <a
          href={githubAttachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[var(--primary-color)] hover:underline"
        >
          <FileText className="w-3 h-3" />
          View processed file
        </a>
      </div>
    )}
  </div>
);

const ConversationComp: React.FC<ConversationCompProps> = ({
  role,
  content,
  images,
  githubAttachment,
  isStreaming = false,
  isReasoningModel = false,
  reasoningContent: propReasoningContent,
  mainContent: propMainContent,
  hasActiveReasoning = false,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showReasoning, setShowReasoning] = useState<boolean>(false);

  const isUser = role === "user";

  // Parse reasoning content if not provided as props
  const parsedContent = useMemo(() => {
    if (propReasoningContent !== undefined || propMainContent !== undefined) {
      return {
        reasoningContent: propReasoningContent,
        mainContent: propMainContent ?? content,
      };
    }
    return parseReasoningContent(content, isStreaming);
  }, [content, propReasoningContent, propMainContent, isStreaming]);

  const { reasoningContent, mainContent } = parsedContent;

  // Memoize expensive computations
  const containerClasses = useMemo(
    () => clsx("flex gap-4", isUser ? "flex-row-reverse" : "flex-row"),
    [isUser]
  );

  const messageClasses = useMemo(
    () =>
      clsx("flex-1 max-w-[85%] space-y-2", isUser ? "text-right" : "text-left"),
    [isUser]
  );

  const bubbleClasses = useMemo(
    () =>
      clsx(
        "inline-block max-w-full p-4 rounded-2xl shadow-sm border",
        isUser
          ? "bg-[var(--bubble-bg)]"
          : "bg-[var(--card-bg)] border-[var(--border-color)]"
      ),
    [isUser]
  );

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_TIMEOUT);
  }, []);

  const toggleReasoning = useCallback(() => {
    setShowReasoning((prev) => !prev);
  }, []);

  // Auto-expand reasoning when actively streaming
  useEffect(() => {
    if (hasActiveReasoning && reasoningContent) {
      setShowReasoning(true);
    }
  }, [hasActiveReasoning, reasoningContent]);

  return (
    <motion.div {...messageVariants} className={containerClasses}>
      <Avatar isUser={isUser} />

      <div className={messageClasses}>
        <div className={bubbleClasses}>
          {/* Display images if present */}
          {images && images.length > 0 && <ImageGallery images={images} />}

          {/* Display GitHub attachment if present */}
          {githubAttachment && githubAttachment.url && (
            <GitHubAttachmentDisplay githubAttachment={githubAttachment} />
          )}

          {reasoningContent && reasoningContent.length > 0 && (
            <ReasoningSection
              reasoningContent={reasoningContent}
              showReasoning={showReasoning}
              onToggle={toggleReasoning}
              isStreaming={isStreaming}
              hasActiveReasoning={hasActiveReasoning}
              isUser={isUser}
            />
          )}

          {mainContent && (
            <MainContent
              content={mainContent}
              isStreaming={isStreaming}
              hasActiveReasoning={hasActiveReasoning}
              isUser={isUser}
              onCopy={handleCopy}
              copied={copied}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ConversationComp;
