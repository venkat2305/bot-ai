import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, X, Menu } from "lucide-react";
import InputBar from "./InputBar";
import ConversationComp from "./ConversationComp";
import useConversation from "../../hooks/useConversation";
import { ImageAttachment, GitHubAttachment } from "@/types/chat";
import { useRouter } from 'next/navigation';
import GitHubImportModal from "../ui/GitHubImportModal";

interface ConversationContainerProps {
  chatId?: string;
  themeMode?: "light" | "dark";
  isMobile?: boolean;
  onToggleSidebar?: () => void;
}

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  capabilities?: string[];
}

function ConversationContainer({ chatId, themeMode, isMobile = false, onToggleSidebar }: ConversationContainerProps) {
  const {
    messages,
    loading,
    selectedModelId,
    setSelectedModelId,
    selectedModel,
    availableModels,
    sendMessage,
    isStreaming,
    cancelStream,
  } = useConversation(chatId);
  const router = useRouter();

  const [inputText, setInputText] = React.useState<string>("");
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [pendingGitHubAttachment, setPendingGitHubAttachment] = useState<GitHubAttachment | null>(null);

  const handleSend = async (question: string, images?: ImageAttachment[], githubAttachment?: GitHubAttachment, useSearchGrounding?: boolean) => {
    await sendMessage(question, images, githubAttachment, useSearchGrounding);
    setPendingGitHubAttachment(null);
  };

  const handleGitHubImport = async (repoUrl: string, selectedFiles: string[], branch?: string) => {
    try {
      const response = await fetch('/api/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, selectedFiles, branch }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import repository');
      }

      const result = await response.json();
      
      const githubAttachment: GitHubAttachment = {
        type: 'github',
        url: result.fileUrl,
        filename: result.fileName,
        repoUrl,
        branch: branch || 'main',
        totalFiles: result.totalFiles,
        totalSize: result.totalSize,
      };

      setPendingGitHubAttachment(githubAttachment);
      // Remove the automatic text setting
      // setInputText(`Please analyze the GitHub repository: ${repoUrl}`);
    } catch (error) {
      console.error('GitHub import error:', error);
      throw error;
    }
  };

  const handleRemoveGitHubAttachment = () => {
    setPendingGitHubAttachment(null);
  };

  const getModelOptions = (): SelectOption[] => {
    return availableModels.map(model => ({
      value: model.id,
      label: `${model.displayName} (${model.serviceProvider.toUpperCase()})`,
      description: model.description,
      capabilities: Object.entries(model.capabilities)
        .filter(([_, value]) => value)
        .map(([key, _]) => key)
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-body)]">
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-[var(--bg-tertiary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold" style={{ color: "var(--primary-color)" }}>
            Bot AI
          </h1>
          <div className="w-10" /> {/* Spacer for centered title */}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-3xl">
                <InputBar
                  value={inputText}
                  onChange={setInputText}
                  onSend={handleSend}
                  disabled={loading}
                  isStreaming={isStreaming}
                  onCancel={cancelStream}
                  placeholder="Type your message..."
                  selectedModelId={selectedModelId}
                  onModelChange={setSelectedModelId}
                  availableModels={getModelOptions()}
                  supportsImages={selectedModel?.capabilities.imageInput || false}
                  supportsSearchGrounding={selectedModel?.capabilities.searchSupport || false}
                  onGitHubImport={() => setIsGitHubModalOpen(true)}
                  githubAttachment={pendingGitHubAttachment}
                  onRemoveGitHubAttachment={handleRemoveGitHubAttachment}
                  isMobile={isMobile}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="conversation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex-1 overflow-y-auto space-y-6 ${isMobile ? 'p-4 pb-20' : 'p-6'}`}
            >
              {messages.map((message, index) => (
                <ConversationComp
                  key={index}
                  role={message.role}
                  content={message.content}
                  images={message.images}
                  githubAttachment={message.githubAttachment}
                  isStreaming={message.isStreaming}
                  isReasoningModel={selectedModel?.capabilities.isReasoningModel}
                  reasoningContent={message.reasoningContent}
                  mainContent={message.mainContent}
                  hasActiveReasoning={message.hasActiveReasoning}
                  themeMode={themeMode}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed Input Bar for Mobile */}
        {messages.length > 0 && (
          <div 
            className={`
              ${isMobile ? 'fixed bottom-0 left-0 right-0 bg-[var(--bg-body)] border-t z-30' : 'border-t'} 
              p-4 flex justify-center w-full
            `} 
            style={{ borderColor: "var(--border-color)" }}
          >
            <div className="w-full max-w-3xl">
              <InputBar
                value={inputText}
                onChange={setInputText}
                onSend={handleSend}
                disabled={loading}
                isStreaming={isStreaming}
                onCancel={cancelStream}
                placeholder="Ask a follow-up question..."
                selectedModelId={selectedModelId}
                onModelChange={setSelectedModelId}
                availableModels={getModelOptions()}
                supportsImages={selectedModel?.capabilities.imageInput || false}
                supportsSearchGrounding={selectedModel?.capabilities.searchSupport || false}
                onGitHubImport={() => setIsGitHubModalOpen(true)}
                githubAttachment={pendingGitHubAttachment}
                onRemoveGitHubAttachment={handleRemoveGitHubAttachment}
                isMobile={isMobile}
              />
            </div>
          </div>
        )}
      </div>

      <GitHubImportModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        onImport={handleGitHubImport}
      />
    </div>
  );
}

export default ConversationContainer;