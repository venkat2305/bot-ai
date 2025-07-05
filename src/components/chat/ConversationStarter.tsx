import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import clsx from "clsx";

interface ConversationStarterProps {
  question: string;
  subtext?: string;
  onClick: (question: string) => void;
}

function ConversationStarter({ question, subtext, onClick }: ConversationStarterProps) {
  const handleClick = (): void => {
    onClick(question);
  };

  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        y: -2,
      }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "group relative p-5 rounded-2xl border cursor-pointer transition-all duration-300",
        "bg-[var(--card-bg)] border-[var(--border-color)]",
        "hover:border-[var(--primary-color)] hover:shadow-lg"
      )}
      style={{ boxShadow: "var(--shadow)" }}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-start gap-2 mb-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: Math.random() * 2
              }}
              className="mt-0.5"
            >
              <Sparkles 
                className="w-4 h-4 flex-shrink-0" 
                style={{ color: "var(--primary-color)" }} 
              />
            </motion.div>
            <p 
              className="font-semibold text-sm leading-relaxed"
              style={{ color: "var(--text-color)" }}
            >
              {question}
            </p>
          </div>
          {subtext && (
            <p 
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {subtext}
            </p>
          )}
        </div>
        
        <motion.div
          initial={{ x: 0, opacity: 0.5 }}
          whileHover={{ x: 4, opacity: 1 }}
          className="flex-shrink-0 mt-1"
        >
          <ArrowRight 
            className="w-4 h-4 transition-colors duration-200 group-hover:text-[var(--primary-color)]" 
            style={{ color: "var(--text-muted)" }}
          />
        </motion.div>
      </div>
      
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, var(--primary-color)10, transparent)`,
        }}
      />
    </motion.div>
  );
}

export default ConversationStarter;