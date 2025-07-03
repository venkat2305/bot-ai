import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";
import InputBar from "../components/InputBar";
import ConversationComp from "../components/ConversationComp";
import ConversationStarter from "../components/ConversationStarter";
import siteIcon from "../assets/site-icon.png";
import sampleData from "../assets/sampleData.json";
import useConversation, { ModelType } from "../hooks/useConversation";
import useOpenRouterModels from "../hooks/useOpenRouterModels";
import useGroqModels from "../hooks/useGroqModels";
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
}

interface CustomSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder: string;
}

function ConversationContainer({ chatId }: ConversationContainerProps) {
  const {
    messages,
    loading,
    selectedModelType,
    setSelectedModelType,
    selectedModel,
    setSelectedModel,
    sendMessage,
  } = useConversation(chatId);
  const router = useRouter();

  const { openRouterModels } = useOpenRouterModels();
  const { groqModels } = useGroqModels();
  const perplexityModels: string[] = ["r1-1776"];
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

  const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder }) => (
    <div className="relative">
      <select
        className={clsx(
          "appearance-none bg-[var(--card-bg)] border border-[var(--border-color)]",
          "rounded-xl px-4 py-2.5 pr-10 text-sm font-medium",
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

  const modelTypeOptions: SelectOption[] = [
    { value: "groq", label: "Groq Models" },
    { value: "openrouter", label: "OpenRouter Models" },
    { value: "perplexity", label: "Perplexity" }
  ];

  const getModelOptions = (): SelectOption[] => {
    switch (selectedModelType) {
      case "groq":
        return groqModels.map(model => ({ value: model.id, label: model.id }));
      case "openrouter":
        return openRouterModels.map(model => ({ value: model.id, label: model.name }));
      case "perplexity":
        return perplexityModels.map(model => ({ value: model, label: model }));
      default:
        return [];
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
        
        <div className="flex gap-3">
          <CustomSelect
            value={selectedModelType}
            onChange={(e) => setSelectedModelType(e.target.value as ModelType)}
            options={modelTypeOptions}
            placeholder="Select Model Type"
          />
          <CustomSelect
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            options={getModelOptions()}
            placeholder="Select Model"
          />
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {messages.length ? (
            <motion.div
              key="conversation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin"
            >
              {messages.map((item, index) => (
                <motion.div
                  key={item._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ConversationComp
                    role={item.role}
                    content={item.content}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
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
                <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
                  Ask me anything, and I'll provide detailed, helpful responses
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
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
            <span className="text-sm font-medium">AI is thinking...</span>
          </motion.div>
        )}

        <div className="p-6 border-t" style={{ borderColor: "var(--border-color)" }}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
            >
              {conversationStarters.map((item, index) => (
                <motion.div
                  key={item.question}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <ConversationStarter
                    question={item.question}
                    onAsk={handleSend}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
          <InputBar
            inputText={inputText}
            setInputText={setInputText}
            onAsk={handleSend}
          />
        </div>
      </div>
    </div>
  );
}

export default ConversationContainer;