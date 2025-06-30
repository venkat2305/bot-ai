import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Plus, 
  MessageSquare, 
  Sun, 
  Moon, 
  Menu,
  Sparkles,
  History
} from "lucide-react";
import clsx from "clsx";

function SideBar({ onNewChat, onToggleTheme, themeMode, collapsed, onToggleCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNewChatClick = () => {
    onNewChat();
    navigate("/");
  };

  const menuItems = [
    {
      icon: Plus,
      label: "New Chat",
      onClick: handleNewChatClick,
      primary: true,
      active: location.pathname === "/"
    },
    {
      icon: History,
      label: "Past Conversations",
      onClick: () => navigate("/past-coversation"),
      active: location.pathname === "/past-coversation"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen p-4 gap-4">
      <div className="flex items-center justify-between">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-6 h-6" style={{ color: "var(--primary-color)" }} />
            <h1 className="text-lg font-bold" style={{ color: "var(--primary-color)" }}>
              Bot AI
            </h1>
          </motion.div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg transition-all duration-200 hover:bg-[var(--bg-tertiary)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              onClick={item.onClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left w-full",
                item.primary
                  ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-lg"
                  : item.active
                  ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]"
                  : "hover:bg-[var(--bg-tertiary)] border border-transparent",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto">
        <motion.button
          onClick={onToggleTheme}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={clsx(
            "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full",
            "bg-[var(--bg-tertiary)] hover:bg-[var(--bubble-bg)] border border-[var(--border-color)]",
            collapsed && "justify-center"
          )}
          title={collapsed ? `Switch to ${themeMode === "dark" ? "Light" : "Dark"} Mode` : undefined}
        >
          {themeMode === "dark" ? (
            <Sun className="w-5 h-5 flex-shrink-0" />
          ) : (
            <Moon className="w-5 h-5 flex-shrink-0" />
          )}
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
              style={{ color: "var(--text-color)" }}
            >
              {themeMode === "dark" ? "Light Mode" : "Dark Mode"}
            </motion.span>
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default SideBar;
