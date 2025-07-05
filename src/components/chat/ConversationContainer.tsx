import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, Loader2, Zap, Brain, Search, Image as ImageIcon, FileText, X } from "lucide-react";
import Image from "next/image";
import InputBar from "./InputBar";
import ConversationComp from "./ConversationComp";
import ConversationStarter from "./ConversationStarter";
import siteIcon from "../../assets/site-icon.png";
import sampleData from "../../assets/sampleData.json";
import useConversation from "../../hooks/useConversation";
import clsx from "clsx";
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

interface CustomSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
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
    const result = await sendMessage(question);
    if (result?.newChatId) {
      router.replace(`/chat/${result.newChatId}`);
    }
  };

  const getCapabilityIcons = (capabilities: any) => {
    const icons = [];
    if (capabilities.isReasoningModel) icons.push(<Brain key="reasoning" className="w-3 h-3" />);
    if (capabilities.searchSupport) icons.push(<Search key="search" className="w-3 h-3" />);
    if (capabilities.imageInput) icons.push(<ImageIcon key="image" className="w-3 h-3" />);
    if (capabilities.pdfSupport) icons.push(<FileText key="pdf" className="w-3 h-3" />);
    return icons;
  };

  const ModelSelect: React.FC<CustomSelectProps> = ({ value, onChange, options }) => (
    <div className="relative">
      <select
        className={clsx(
          "appearance-none bg-[var(--card-bg)] border border-[var(--border-color)]",
          "rounded-xl px-4 py-2.5 pr-10 text-sm font-medium min-w-[280px]",
          "text-[var(--text-color)] cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent",
          "transition-all duration-200"
        )}
        style={{ 
          boxShadow: "var(--shadow)",
        }}
        value={value}
        onChange={onChange}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" 
        style={{ color: "var(--text-secondary)" }} />
    </div>
  );

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

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'groq': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'openrouter': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'perplexity': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-body)]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-6 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>
              AI Assistant
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Powered by advanced AI models
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {selectedModel && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)]">
              <span className={clsx(
                "px-2 py-1 rounded-md text-xs font-medium",
                getProviderBadgeColor(selectedModel.serviceProvider)
              )}>
                {selectedModel.serviceProvider.toUpperCase()}
              </span>
              <div className="flex items-center gap-1">
                {getCapabilityIcons(selectedModel.capabilities)}
              </div>
              <span className="text-xs text-[var(--text-secondary)]">
                {selectedModel.contextWindow.toLocaleString()} ctx
              </span>
            </div>
          )}
          
          <ModelSelect
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            options={getModelOptions()}
            placeholder="Select AI Model"
          />
        </div>
      </motion.div>

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
          />
        </div>
      </div>
    </div>
  );
}

export default ConversationContainer;