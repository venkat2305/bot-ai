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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";

interface ConversationCompProps {
  role: "user" | "assistant";
  content: string;
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
}) => (
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
                {reasoningContent}
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

const ConversationComp: React.FC<ConversationCompProps> = ({
  role,
  content,
  isStreaming = false,
  isReasoningModel = false,
  reasoningContent: propReasoningContent,
  mainContent: propMainContent,
  hasActiveReasoning = false,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showReasoning, setShowReasoning] = useState<boolean>(false);

  const isUser = role === "user";
  const mainContent = propMainContent ?? content;
  const reasoningContent = propReasoningContent;

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
        "bg-[var(--card-bg)] border-[var(--border-color)]",
        isUser
          ? "rounded-br-sm bg-[#F4F4F4] dark:from-blue-900/20 dark:to-purple-900/20"
          : "rounded-bl-sm"
      ),
    [isUser]
  );

  const handleCopy = useCallback((text: string): void => {
    navigator.clipboard.writeText(text);
    setCopied(true);
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

  // Reset copied state after timeout
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), COPY_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <motion.div {...messageVariants} className={containerClasses}>
      <Avatar isUser={isUser} />

      <div className={messageClasses}>
        <div className={bubbleClasses}>
          {reasoningContent && (
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
