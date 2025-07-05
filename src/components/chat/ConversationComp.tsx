import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Brain, User, Bot, ClipboardCopy, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";

interface ConversationCompProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

function ConversationComp({ role, content, isStreaming = false }: ConversationCompProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const isUser = role === 'user';

  const handleCopy = (text: string): void => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "flex gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className="flex-shrink-0">
        <div className={clsx(
          "w-10 h-10 rounded-full p-2 shadow-sm border",
          isUser 
            ? "bg-gradient-to-br from-blue-500 to-purple-600 border-blue-200" 
            : "bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] border-[var(--border-color)]"
        )}>
          {isUser ? (
            <User className="w-full h-full text-white" />
          ) : (
            <Bot className="w-full h-full text-white" />
          )}
        </div>
      </div>

      <div className={clsx(
        "flex-1 max-w-[85%] space-y-2",
        isUser ? "text-right" : "text-left"
      )}>
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="font-medium">
            {isUser ? "You" : "AI Assistant"}
          </span>
          {isStreaming && !isUser && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Streaming...</span>
              </div>
            </>
          )}
          <span>•</span>
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className={clsx(
          "inline-block max-w-full p-4 rounded-2xl shadow-sm border",
          "bg-[var(--card-bg)] border-[var(--border-color)]",
          isUser 
            ? "rounded-br-sm bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20" 
            : "rounded-bl-sm"
        )}>
          {content && (
            <div className={clsx(
              "prose prose-sm max-w-none",
              "prose-headings:text-[var(--text-color)]",
              "prose-p:text-[var(--text-color)]",
              "prose-strong:text-[var(--text-color)]",
              "prose-code:text-[var(--primary-color)]",
              "prose-pre:bg-[var(--bg-tertiary)]",
              "prose-pre:border prose-pre:border-[var(--border-color)]",
              "prose-blockquote:border-[var(--primary-color)]",
              "prose-blockquote:text-[var(--text-secondary)]"
            )}>
              <div className="relative">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                {isStreaming && !isUser && (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block w-2 h-4 bg-[var(--primary-color)] ml-1"
                  />
                )}
              </div>
              <button
                onClick={() => handleCopy(content)}
                className="mt-2 text-xs text-[var(--text-secondary)] hover:text-[var(--primary-color)] flex items-center gap-1"
              >
                {copied ? "Copied!" : <ClipboardCopy className="w-3 h-3" />} {copied ? "" : "Copy"}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ConversationComp;