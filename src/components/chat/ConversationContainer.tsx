import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, X } from "lucide-react";
import InputBar from "./InputBar";
import ConversationComp from "./ConversationComp";
import useConversation, { ImageAttachment } from "../../hooks/useConversation";
import { useRouter } from 'next/navigation';

interface ConversationContainerProps {
  chatId?: string;
}

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  capabilities?: string[];
}

function ConversationContainer({ chatId }: ConversationContainerProps) {
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

  const handleSend = async (question: string, images?: ImageAttachment[]) => {
    await sendMessage(question, images);
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
                  disabled={loading || isStreaming}
                  placeholder="Type your message..."
                  selectedModelId={selectedModelId}
                  onModelChange={setSelectedModelId}
                  availableModels={getModelOptions()}
                  supportsImages={selectedModel?.capabilities.imageInput || false}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="conversation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {messages.map((message, index) => (
                <ConversationComp
                  key={index}
                  role={message.role}
                  content={message.content}
                  images={message.images}
                  isStreaming={message.isStreaming}
                  isReasoningModel={selectedModel?.capabilities.isReasoningModel}
                  reasoningContent={message.reasoningContent}
                  mainContent={message.mainContent}
                  hasActiveReasoning={message.hasActiveReasoning}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>


        {messages.length > 0 && (
          <div className="p-4 flex justify-center w-full" style={{ borderColor: "var(--border-color)" }}>
            <div className="w-full max-w-3xl">
              <InputBar
                value={inputText}
                onChange={setInputText}
                onSend={handleSend}
                disabled={loading || isStreaming}
                placeholder="Ask a follow-up question..."
                selectedModelId={selectedModelId}
                onModelChange={setSelectedModelId}
                availableModels={getModelOptions()}
                supportsImages={selectedModel?.capabilities.imageInput || false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversationContainer;