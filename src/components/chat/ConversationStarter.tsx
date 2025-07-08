import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
        scale: 1.01,
        y: -1,
      }}
      whileTap={{ scale: 0.99 }}
      className={clsx(
        "group relative p-3 rounded-lg border cursor-pointer transition-all duration-300",
        "bg-[var(--card-bg)] border-[var(--border-color)]",
        "hover:border-[var(--primary-color)] hover:shadow-md"
      )}
      style={{ boxShadow: "var(--shadow)" }}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between gap-3">
        <p 
          className="font-medium text-sm leading-relaxed flex-1"
          style={{ color: "var(--text-color)" }}
        >
          {question}
        </p>
        
        <motion.div
          initial={{ x: 0, opacity: 0.5 }}
          whileHover={{ x: 2, opacity: 1 }}
          className="flex-shrink-0"
        >
          <ArrowRight 
            className="w-4 h-4 transition-colors duration-200 group-hover:text-[var(--primary-color)]" 
            style={{ color: "var(--text-muted)" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ConversationStarter;