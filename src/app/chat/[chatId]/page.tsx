"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SideBar from "@/components/chat/SideBar";
import ConversationContainer from "@/components/chat/ConversationContainer";
import AlertDialog from '@/components/ui/AlertDialog';

interface Chat {
  id: string;
  title: string;
}

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const resolvedParams = use(params);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(resolvedParams.chatId);
  const [conversationKey, setConversationKey] = useState<number>(Date.now());
  const [chatRefreshKey, setChatRefreshKey] = useState<number>(0); // New state variable

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const previousChatId = currentChatId;
    setCurrentChatId(resolvedParams.chatId);
    
    // Only update conversationKey if we're switching to a different existing chat
    // Don't update when transitioning from 'new' to a real chat ID (same conversation)
    if (previousChatId && previousChatId !== 'new' && resolvedParams.chatId !== previousChatId) {
      setConversationKey(Date.now());
    }
  }, [resolvedParams.chatId, currentChatId]);

  const toggleTheme = (): void => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const toggleSidebar = (): void => {
    setSidebarCollapsed((prev) => !prev);
  };

  const openDeleteConfirmModal = (chatId: string): void => {
    setChatToDeleteId(chatId);
    setIsConfirmModalOpen(true);
  };

  const closeDeleteConfirmModal = (): void => {
    setIsConfirmModalOpen(false);
    setChatToDeleteId(null);
  };

  const confirmDeleteChat = async (): Promise<void> => {
    if (!chatToDeleteId) return;
    closeDeleteConfirmModal();

    try {
      const response = await fetch(`/api/chat/${chatToDeleteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Assuming you have a way to refresh recent chats in SideBar or handle state globally
        // For now, we'll just redirect if the current chat was deleted.
        if (currentChatId === chatToDeleteId) {
          window.location.href = '/'; // Force reload and redirect to home
        }
        setChatRefreshKey((prev) => prev + 1); // Increment to trigger refresh
        // You might want to trigger a re-fetch of chats in SideBar here
      } else {
        console.error('Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setChatToDeleteId(null);
    }
  };

  useEffect(() => {
    document.body.dataset.theme = themeMode;
  }, [themeMode]);

  return (
    <div className="flex min-h-screen w-full bg-[var(--bg-body)] transition-colors duration-300">
      <motion.div
        initial={false}
        animate={{
          width: sidebarCollapsed ? "4rem" : "16rem",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-shrink-0 border-r"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="glass-effect h-full">
          <SideBar
            onToggleTheme={toggleTheme}
            themeMode={themeMode}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            currentChatId={currentChatId}
            onOpenDeleteConfirm={openDeleteConfirmModal}
            refreshChatsTrigger={chatRefreshKey} // Pass the new prop
          />
        </div>
      </motion.div>
      
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={conversationKey}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ConversationContainer chatId={currentChatId} />
          </motion.div>
        </AnimatePresence>
      </div>
      <AlertDialog
        isOpen={isConfirmModalOpen}
        onClose={closeDeleteConfirmModal}
        onConfirm={confirmDeleteChat}
        title="Confirm Deletion"
        description="Are you sure you want to delete this chat? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
} 