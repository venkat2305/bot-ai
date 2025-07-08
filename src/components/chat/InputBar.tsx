import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, ChevronDown } from "lucide-react";
import clsx from "clsx";

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  capabilities?: string[];
}

interface InputBarProps {
  value: string;
  onChange: (text: string) => void;
  onSend: (question: string) => void;
  disabled?: boolean;
  placeholder?: string;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  availableModels: SelectOption[];
}

function InputBar({ 
  value, 
  onChange, 
  onSend, 
  disabled = false, 
  placeholder = "Type your message here...",
  selectedModelId,
  onModelChange,
  availableModels
}: InputBarProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (): void => {
    if (value.trim() !== "" && !disabled) {
      onSend(value);
      onChange("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onChange(e.target.value);
  };

  const handleFocus = (): void => {
    setIsFocused(true);
  };

  const handleBlur = (): void => {
    setIsFocused(false);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onModelChange(e.target.value);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "relative p-4 rounded-2xl border transition-all duration-300",
        "bg-[var(--card-bg)] border-[var(--border-color)]",
        isFocused && "ring-2 ring-[var(--primary-color)] ring-opacity-50",
        disabled && "opacity-50 cursor-not-allowed"
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
              "text-sm leading-6 min-h-[24px] max-h-[120px]",
              disabled && "cursor-not-allowed"
            )}
            placeholder={placeholder}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            rows={1}
          />
          
          {value.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-0 right-0 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {value.length} characters
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm",
              "transition-all duration-200 min-w-[80px] justify-center",
              value.trim() && !disabled
                ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-lg hover:shadow-xl"
                : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
            <span>{disabled ? "Sending..." : "Send"}</span>
          </motion.button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--border-color)]">
        {/* Model Selection */}
        <div className="relative">
          <select
            className={clsx(
              "appearance-none bg-[var(--bg-tertiary)] border border-[var(--border-color)]",
              "rounded-lg px-3 py-1.5 pr-8 text-xs font-medium min-w-[180px]",
              "text-[var(--text-color)] cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent",
              "transition-all duration-200",
              disabled && "cursor-not-allowed opacity-50"
            )}
            value={selectedModelId}
            onChange={handleModelChange}
            disabled={disabled}
          >
            {availableModels.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 pointer-events-none" 
            style={{ color: "var(--text-secondary)" }} />
        </div>

        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          disabled={disabled}
          className={clsx(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all duration-200",
            disabled 
              ? "cursor-not-allowed opacity-50" 
              : "hover:bg-[var(--bg-tertiary)]"
          )}
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