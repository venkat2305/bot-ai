import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Plus, 
  MessageSquare, 
  Sun, 
  Moon, 
  Menu,
  Sparkles,
  Trash2,
  Clock,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import clsx from "clsx";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

interface Chat {
  uuid: string;
  title: string;
  updatedAt: string;
}

interface SideBarProps {
  onToggleTheme: () => void;
  themeMode: "light" | "dark";
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentChatId?: string;
  onOpenDeleteConfirm: (chatId: string) => void;
  refreshChatsTrigger?: number;
}

function UserAuth({ collapsed }: { collapsed: boolean }) {
  const { data: session } = useSession();

  if (session) {
    if (collapsed) {
      // When collapsed, only show the user avatar as a small compact element
      return (
        <motion.div
          className="flex items-center justify-center p-2 rounded-lg transition-all duration-200 w-full bg-[var(--bg-tertiary)] hover:bg-[var(--bubble-bg)] border border-[var(--border-color)]"
          whileHover={{ scale: 1.05 }}
          title={session.user?.name || "User"}
        >
          {session.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 rounded-full bg-gray-300 p-1" />
          )}
        </motion.div>
      );
    }

    return (
      <div className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full bg-[var(--bg-tertiary)] hover:bg-[var(--bubble-bg)] border border-[var(--border-color)]">
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <User className="w-8 h-8 rounded-full bg-gray-300 p-1" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text-color)" }}>
            {session.user?.name}
          </p>
          <p className="text-xs truncate mt-1" style={{ color: "var(--text-muted)" }}>
            {session.user?.email}
          </p>
        </div>
        <motion.button
          onClick={() => signOut()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-lg transition-all duration-200 hover:bg-red-100 dark:hover:bg-red-900/20"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 text-red-500" />
        </motion.button>
      </div>
    );
  }

  return (
    <motion.button
      onClick={() => signIn("google")}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full",
        "bg-[var(--bg-tertiary)] hover:bg-[var(--bubble-bg)] border border-[var(--border-color)]",
        collapsed && "justify-center p-3"
      )}
      title={collapsed ? "Sign In" : undefined}
    >
      <LogIn className={clsx("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          className="text-sm font-medium whitespace-nowrap overflow-hidden"
          style={{ color: "var(--text-color)" }}
        >
          Sign In with Google
        </motion.span>
      )}
    </motion.button>
  );
}

function SideBar({ 
  onToggleTheme, 
  themeMode, 
  collapsed, 
  onToggleCollapse,
  currentChatId,
  onOpenDeleteConfirm,
  refreshChatsTrigger,
}: SideBarProps) {
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const handleChatCreated = () => loadRecentChats();
    if (status === 'authenticated') {
      loadRecentChats();
      window.addEventListener('chat-created', handleChatCreated);
    }
    return () => {
      window.removeEventListener('chat-created', handleChatCreated);
    };
  }, [status, refreshChatsTrigger]);

  const loadRecentChats = async (): Promise<void> => {
    if (status === "authenticated") {
      try {
        const response = await fetch('/api/chats');
        if (response.ok) {
          const chats = await response.json();
          setRecentChats(chats);
        } else {
          console.error('Failed to fetch recent chats');
        }
      } catch (error) {
        console.error('Error fetching recent chats:', error);
      }
    }
  };

  const handleNewChatClick = (): void => {
    router.push(`/chat/${uuidv4()}`);
  };

  const handleChatSelect = (chat: Chat): void => {
    router.push(`/chat/${chat.uuid}`);
  };

  const handleDeleteChat = async (
    e: React.MouseEvent,
    chatId: string
  ): Promise<void> => {
    e.stopPropagation();
    onOpenDeleteConfirm(chatId);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={clsx(
      "flex flex-col h-screen gap-4 transition-all duration-300",
      collapsed ? "p-2" : "p-4"
    )}>
      {/* Header */}
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
          className={clsx(
            "rounded-lg transition-all duration-200 hover:bg-[var(--bg-tertiary)]",
            collapsed ? "p-3" : "p-3"
          )}
          style={{ color: "var(--text-secondary)" }}
        >
          <Menu className={clsx(collapsed ? "w-5 h-5" : "w-5 h-5")} />
        </button>
      </div>

      {/* New Chat Button */}
      <motion.button
        onClick={handleNewChatClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={clsx(
          "flex items-center gap-3 rounded-xl transition-all duration-200 text-left w-full",
          "bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-lg",
          collapsed ? "justify-center p-3" : "p-3"
        )}
        title={collapsed ? "New Chat" : undefined}
      >
        <Plus className={clsx("flex-shrink-0", collapsed ? "w-5 h-5" : "w-5 h-5")} />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="text-sm font-medium whitespace-nowrap overflow-hidden"
          >
            New Chat
          </motion.span>
        )}
      </motion.button>

      {/* Recent Chats - Only show when not collapsed */}
      {!collapsed && recentChats.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center gap-2 mb-3 px-2">
            <Clock className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Recent Chats
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
            <AnimatePresence>
              {recentChats.map((chat, index) => (
                <motion.div
                  key={chat.uuid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={clsx(
                    "group relative px-3 py-1 rounded-lg cursor-pointer transition-all duration-200",
                    "hover:bg-[var(--bg-tertiary)] border border-transparent",
                    currentChatId === chat.uuid 
                      ? "bg-[var(--bg-tertiary)] border-[var(--primary-color)]" 
                      : "hover:border-[var(--border-color)]"
                  )}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" 
                      style={{ color: "var(--text-secondary)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" 
                         style={{ color: "var(--text-color)" }}>
                        {chat.title}
                      </p>
                      {/* <p className="text-xs truncate mt-1" 
                         style={{ color: "var(--text-muted)" }}>
                        {formatDate(chat.updatedAt)}
                      </p> */}
                    </div>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1 
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleDeleteChat(e, chat.uuid)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-200 hover:bg-red-100 dark:hover:bg-red-900/20"
                      title="Delete chat"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Bottom Section */}
       <div className="mt-auto flex flex-col gap-2">
        {/* User Authentication */}
        <UserAuth collapsed={collapsed} />

        {/* Theme Toggle */}
        <motion.button
          onClick={onToggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={clsx(
            "flex items-center gap-2 rounded-lg transition-all duration-200 hover:bg-[var(--bg-tertiary)] w-full",
            collapsed ? "justify-center p-3" : "p-2"
          )}
          title={collapsed ? 'Toggle theme' : undefined}
        >
          {themeMode === 'light' ? (
            <Sun className={clsx(collapsed ? "w-5 h-5" : "w-5 h-5")} />
          ) : (
            <Moon className={clsx(collapsed ? "w-5 h-5" : "w-5 h-5")} />
          )}
          {!collapsed && (
            <span className="text-sm" style={{ color: 'var(--text-color)' }}>
              {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default SideBar;