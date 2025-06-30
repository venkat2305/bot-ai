import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip } from "lucide-react";
import clsx from "clsx";

function InputBar({ inputText, setInputText, onAsk }) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = () => {
    if (inputText.trim() !== "") {
      onAsk(inputText);
      setInputText("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "relative p-4 rounded-2xl border transition-all duration-300",
        "bg-[var(--card-bg)] border-[var(--border-color)]",
        isFocused && "ring-2 ring-[var(--primary-color)] ring-opacity-50"
      )}
      style={{ boxShadow: "var(--shadow-lg)" }}
    >
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className={clsx(
              "w-full resize-none border-0 bg-transparent outline-none",
              "text-[var(--text-color)] placeholder-[var(--text-muted)]",
              "text-sm leading-6 min-h-[24px] max-h-[120px]"
            )}
            placeholder="Type your message here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={1}
          />
          
          {inputText.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-0 right-0 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {inputText.length} characters
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!inputText.trim()}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm",
              "transition-all duration-200 min-w-[80px] justify-center",
              inputText.trim()
                ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-lg hover:shadow-xl"
                : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </motion.button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--border-color)]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all duration-200 hover:bg-[var(--bg-tertiary)]"
          style={{ color: "var(--text-muted)" }}
        >
          <Paperclip className="w-3 h-3" />
          Attach File
        </motion.button>
        
        <div className="flex-1"></div>
        
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </motion.div>
  );
}

export default InputBar;
