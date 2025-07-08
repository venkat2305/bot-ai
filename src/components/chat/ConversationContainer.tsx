import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, X } from "lucide-react";
import Image from "next/image";
import InputBar from "./InputBar";
import ConversationComp from "./ConversationComp";
import ConversationStarter from "./ConversationStarter";
import siteIcon from "../../assets/site-icon.png";
import sampleData from "../../assets/sampleData.json";
import useConversation from "../../hooks/useConversation";
import { useRouter } from 'next/navigation';

interface ConversationContainerProps {
  chatId?: string;
}

interface ConversationStarter {
  question: string;
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

  const [conversationStarters, setConversationStarters] = React.useState<ConversationStarter[]>([]);

  React.useEffect(() => {
    const starters: ConversationStarter[] = [];
    const usedIndices = new Set<number>();
    const numStarters = Math.min(4, sampleData.length);

    while (starters.length < numStarters) {
      const randNum = Math.floor(Math.random() * sampleData.length);
      if (!usedIndices.has(randNum)) {
        starters.push({
          question: sampleData[randNum].question,
        });
        usedIndices.add(randNum);
      }
    }
    setConversationStarters(starters);
  }, []);

  const [inputText, setInputText] = React.useState<string>("");

  const handleSend = async (question: string) => {
    await sendMessage(question);
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
              key="welcome"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              <div className="text-center mb-12">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="w-24 h-24 mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] shadow-2xl"
                >
                  <Image src={siteIcon} alt="AI Assistant" className="w-full h-full object-contain" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-color)" }}>
                  How Can I Help You Today?
                </h2>
                <p className="text-lg mb-4" style={{ color: "var(--text-secondary)" }}>
                  Ask me anything, and I'll provide detailed, helpful responses
                </p>
                {selectedModel && (
                  <div className="flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <Zap className="w-4 h-4" />
                    <span>Currently using {selectedModel.displayName}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                {conversationStarters.map((starter, index) => (
                  <ConversationStarter
                    key={index}
                    question={starter.question}
                    onClick={() => handleSend(starter.question)}
                  />
                ))}
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

        {(loading || isStreaming) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center p-4 border-t"
            style={{ 
              borderColor: "var(--border-color)",
              color: "var(--text-secondary)"
            }}
          >
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm font-medium">
              {isStreaming ? "AI is streaming..." : "AI is thinking..."}
            </span>
            {isStreaming && (
              <button
                onClick={cancelStream}
                className="ml-4 px-3 py-1 text-xs rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            )}
          </motion.div>
        )}

        <div className="p-6 border-t" style={{ borderColor: "var(--border-color)" }}>
          <InputBar
            value={inputText}
            onChange={setInputText}
            onSend={handleSend}
            disabled={loading || isStreaming}
            placeholder="Type your message..."
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
            availableModels={getModelOptions()}
          />
        </div>
      </div>
    </div>
  );
}

export default ConversationContainer;