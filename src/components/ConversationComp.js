import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Brain, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";

function parseThink(text) {
  const start = text.indexOf("<think>");
  const end = text.indexOf("</think>");
  let reasoning = "";
  let answer = text;
  let inProgress = false;

  if (start !== -1) {
    if (end !== -1 && end > start) {
      // Complete reasoning block found
      reasoning = text.slice(start + 7, end);
      answer = (text.slice(0, start) + text.slice(end + 8)).trim();
    } else {
      // Incomplete reasoning block (streaming in progress)
      reasoning = text.slice(start + 7);
      answer = text.slice(0, start).trim();
      inProgress = true;
    }
  }

  return { reasoning, answer, inProgress };
}

function ConversationComp({ who, quesAns, time }) {
  const { reasoning, answer, inProgress } = parseThink(quesAns);
  const [open, setOpen] = useState(inProgress); // Auto-open when reasoning is in progress
  const isUser = who === "user";

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
          <span>•</span>
          <span>{time.split(",")[1]?.trim() || time}</span>
        </div>

        <div className={clsx(
          "inline-block max-w-full p-4 rounded-2xl shadow-sm border",
          "bg-[var(--card-bg)] border-[var(--border-color)]",
          isUser 
            ? "rounded-br-sm bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20" 
            : "rounded-bl-sm"
        )}>
          {reasoning && (
            <div className="mb-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                  "bg-[var(--bg-tertiary)] hover:bg-[var(--bubble-bg)] border border-[var(--border-color)]"
                )}
                onClick={() => setOpen((p) => !p)}
                style={{ color: "var(--text-secondary)" }}
              >
                <Brain className="w-4 h-4" />
                <span>AI Reasoning</span>
                {inProgress && (
                  <div className="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-pulse" />
                )}
                {open ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </motion.button>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]"
                  >
                    <div className="prose prose-sm max-w-none text-xs" style={{ color: "var(--text-secondary)" }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{reasoning}</ReactMarkdown>
                      {inProgress && (
                        <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          <span>Reasoning in progress...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {answer && (
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
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ConversationComp;
