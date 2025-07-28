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
  X,
  Crown,
} from "lucide-react";
import clsx from "clsx";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useSubscription } from "@/hooks/useSubscription";
import { ProBadge } from "@/components/ui/ProFeatureGate";
import UpgradeModal from "@/components/subscription/UpgradeModal";

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
  isMobile?: boolean;
  onCloseMobile?: () => void;
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
  isMobile = false,
  onCloseMobile,
}: SideBarProps) {
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const { isPro, canUpgrade, subscriptionData } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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
        
        <div className="flex items-center gap-2">
          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="rounded-lg p-2 transition-all duration-200 hover:bg-[var(--bg-tertiary)]"
              style={{ color: "var(--text-secondary)" }}
            >
              <X className="w-5 h-5" />
            </button>
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

        {/* Subscription Status & Upgrade */}
        {session && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={clsx(
              "flex items-center gap-2 rounded-lg transition-all duration-200 w-full border",
              collapsed ? "justify-center p-3" : "p-2",
              isPro 
                ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 hover:from-yellow-100 hover:to-yellow-200" 
                : "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100"
            )}
          >
            {isPro ? (
              <>
                <Crown className={clsx("text-yellow-600", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-yellow-800">Pro</span>
                      <ProBadge className="ml-auto" />
                    </div>
                    <div className="text-xs text-yellow-700 truncate">
                      {subscriptionData?.subscription?.isActive ? 'Active' : 'Pro Access'}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <Crown className={clsx("text-blue-600", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-blue-800">Free Plan</span>
                    <div className="text-xs text-blue-700">Upgrade to Pro</div>
                  </div>
                )}
                {canUpgrade && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className={clsx(
                      "bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors",
                      collapsed ? "p-1" : "px-2 py-1 text-xs"
                    )}
                    title={collapsed ? 'Upgrade to Pro' : undefined}
                  >
                    {collapsed ? <Crown className="w-3 h-3" /> : 'Upgrade'}
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}

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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}

export default SideBar;