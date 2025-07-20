import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, ChevronDown, X, Image as ImageIcon, FileText, Square, Github, Search } from "lucide-react";
import clsx from "clsx";
import { ImageAttachment, GitHubAttachment } from "@/types/chat";
import { compressImage, uploadImage } from "@/lib/imageUtils";

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  capabilities?: string[];
}

interface InputBarProps {
  value: string;
  onChange: (text: string) => void;
  onSend: (question: string, images?: ImageAttachment[], githubAttachment?: GitHubAttachment, useSearchGrounding?: boolean) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onCancel?: () => void;
  placeholder?: string;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  availableModels: SelectOption[];
  supportsImages?: boolean;
  supportsSearchGrounding?: boolean;
  onGitHubImport?: () => void;
  githubAttachment?: GitHubAttachment | null;
  onRemoveGitHubAttachment?: () => void;
  isMobile?: boolean;
}

function InputBar({ 
  value, 
  onChange, 
  onSend, 
  disabled = false,
  isStreaming = false,
  onCancel,
  placeholder = "Type your message here...",
  selectedModelId,
  onModelChange,
  availableModels,
  supportsImages = false,
  supportsSearchGrounding = false,
  onGitHubImport,
  githubAttachment,
  onRemoveGitHubAttachment,
  isMobile = false
}: InputBarProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (): void => {
    // Don't send if streaming or disabled or no content
    if (isStreaming || disabled || (!value.trim() && attachedImages.length === 0 && !githubAttachment)) {
      return;
    }
    
    onSend(value, attachedImages.length > 0 ? attachedImages : undefined, githubAttachment || undefined, useSearchGrounding);
    onChange("");
    setAttachedImages([]);
  };

  const handleCancel = (): void => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) {
        handleCancel();
      } else {
        handleSubmit();
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>): Promise<void> => {
    if (!supportsImages || isStreaming) return;

    const items = Array.from(e.clipboardData.items);
    const imageFiles = items
      .filter(item => item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(file => file !== null) as File[];

    if (imageFiles.length === 0) return;

    e.preventDefault();
    setIsUploading(true);
    
    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const compressedFile = await compressImage(file);
        return await uploadImage(compressedFile, file);
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setAttachedImages(prev => [...prev, ...uploadedImages]);
    } catch (error) {
      console.error('Paste upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload pasted image');
    } finally {
      setIsUploading(false);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isStreaming) return;
    
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const compressedFile = await compressImage(file);
        return await uploadImage(compressedFile, file);
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setAttachedImages(prev => [...prev, ...uploadedImages]);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAttachClick = () => {
    if (supportsImages && fileInputRef.current && !isStreaming) {
      fileInputRef.current.click();
    }
  };

  const removeImage = (index: number) => {
    if (isStreaming) return;
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
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
        "relative p-3 rounded-xl border transition-all duration-300",
        "bg-[var(--card-bg)] border-[var(--border-color)]",
        isFocused && "ring-2 ring-[var(--primary-color)] ring-opacity-50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={{ boxShadow: "var(--shadow-lg)" }}
    >
      {/* Attachment Previews - Combined Row */}
      {(githubAttachment || attachedImages.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-2 items-center">
          {/* GitHub Attachment Preview */}
          {githubAttachment && (
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] h-16">
                <Github className="w-4 h-4 text-[var(--primary-color)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text-color)] truncate">
                    {githubAttachment.repoUrl ? githubAttachment.repoUrl.replace('https://github.com/', '') : 'GitHub Repository'}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    {githubAttachment.branch && <span>{githubAttachment.branch}</span>}
                    {githubAttachment.totalFiles && <span>• {githubAttachment.totalFiles} files</span>}
                    {githubAttachment.totalSize && <span>• {(githubAttachment.totalSize / 1024).toFixed(1)}KB</span>}
                  </div>
                </div>
                {onRemoveGitHubAttachment && !isStreaming && (
                  <button
                    onClick={onRemoveGitHubAttachment}
                    className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Image Previews */}
          {attachedImages.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.url}
                alt={image.filename}
                className="w-16 h-16 object-cover rounded-lg border border-[var(--border-color)]"
              />
              {!isStreaming && (
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-lg truncate">
                {image.filename}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
        <textarea
            ref={textareaRef}
            className={clsx(
              "w-full resize-none border-0 bg-transparent outline-none",
              "text-[var(--text-color)] placeholder-[var(--text-muted)]",
              "text-sm leading-5 min-h-[20px] max-h-[120px]",
              disabled && "cursor-not-allowed"
            )}
            placeholder={supportsImages ? `${placeholder} (Paste images or use the attach button)` : placeholder}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={handleFocus}
            onBlur={handleBlur}
            // disabled={disabled}
            rows={1}
          />
        </div>

        <div className="flex items-center gap-2">
          {isStreaming ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm",
                "transition-all duration-200 min-w-[70px] justify-center",
                "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl"
              )}
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
              onClick={handleSubmit}
              disabled={(!value.trim() && attachedImages.length === 0 && !githubAttachment) || disabled}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm",
                "transition-all duration-200 min-w-[70px] justify-center",
                (value.trim() || attachedImages.length > 0 || githubAttachment) && !disabled
                  ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-lg hover:shadow-xl"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
              <span>{disabled ? "Sending..." : "Send"}</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border-color)]">
        {/* Model Selection */}
        <div className="relative">
          <select
            className={clsx(
              "appearance-none bg-[var(--bg-tertiary)] border border-[var(--border-color)]",
              "rounded-md px-2 py-1 pr-6 text-xs font-medium",
              "text-[var(--text-color)] cursor-pointer",
              "focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] focus:border-transparent",
              "transition-all duration-200",
              (disabled || isStreaming) && "cursor-not-allowed opacity-50",
              isMobile ? "min-w-[120px]" : "min-w-[160px]"
            )}
            value={selectedModelId}
            onChange={handleModelChange}
            disabled={disabled || isStreaming}
          >
            {availableModels.map((model) => (
              <option key={model.value} value={model.value}>
                {isMobile ? model.label.split(' (')[0] : model.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 pointer-events-none" 
            style={{ color: "var(--text-secondary)" }} />
        </div>

        {/* Action Buttons - Responsive Layout */}
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
          <motion.button
            whileHover={{ scale: disabled || !supportsImages || isStreaming ? 1 : 1.05 }}
            whileTap={{ scale: disabled || !supportsImages || isStreaming ? 1 : 0.95 }}
            onClick={handleAttachClick}
            disabled={disabled || !supportsImages || isUploading || isStreaming}
            className={clsx(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all duration-200",
              disabled || !supportsImages || isStreaming
                ? "cursor-not-allowed opacity-50" 
                : "hover:bg-[var(--bg-tertiary)]"
            )}
            style={{ color: supportsImages ? "var(--text-muted)" : "var(--text-muted)" }}
          >
            {supportsImages ? (
              <>
                <ImageIcon className="w-3 h-3" />
                {!isMobile && (isUploading ? 'Uploading...' : 'Image')}
              </>
            ) : (
              <>
                <Paperclip className="w-3 h-3" />
                {!isMobile && 'Attach'}
              </>
            )}
          </motion.button>

          {onGitHubImport && (
            <motion.button
              whileHover={{ scale: disabled || isStreaming ? 1 : 1.05 }}
              whileTap={{ scale: disabled || isStreaming ? 1 : 0.95 }}
              onClick={onGitHubImport}
              disabled={disabled || isStreaming}
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all duration-200",
                disabled || isStreaming
                  ? "cursor-not-allowed opacity-50" 
                  : "hover:bg-[var(--bg-tertiary)]"
              )}
              style={{ color: "var(--text-muted)" }}
              title="Import GitHub Repository"
            >
              <Github className="w-3 h-3" />
              {!isMobile && 'GitHub'}
            </motion.button>
          )}

          {supportsSearchGrounding && (
            <motion.button
              whileHover={{ scale: disabled || isStreaming ? 1 : 1.05 }}
              whileTap={{ scale: disabled || isStreaming ? 1 : 0.95 }}
              onClick={() => setUseSearchGrounding(!useSearchGrounding)}
              disabled={disabled || isStreaming}
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all duration-200",
                disabled || isStreaming
                  ? "cursor-not-allowed opacity-50" 
                  : "hover:bg-[var(--bg-tertiary)]",
                useSearchGrounding && "bg-[var(--primary-color)] text-white"
              )}
              style={{ color: useSearchGrounding ? "white" : "var(--text-muted)" }}
              title="Enable search grounding for real-time web information"
            >
              <Search className="w-3 h-3" />
              {!isMobile && 'Search'}
            </motion.button>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex-1"></div>
        
        {!isMobile && (
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {isStreaming ? "⏎ Stop • Streaming..." : "⏎ Send • ⇧⏎ New line"}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default InputBar;