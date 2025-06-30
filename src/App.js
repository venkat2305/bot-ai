import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SideBar from "./components/SideBar";
import NewPage from "./pages/NewPage";
import { Route, Routes, useLocation } from "react-router-dom";
import PastConversation from "./pages/PastConversation";

function App() {
  const [newChatKey, setNewChatKey] = useState(Date.now());
  const [themeMode, setThemeMode] = useState("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  useEffect(() => {
    document.body.dataset.theme = themeMode;
  }, [themeMode]);
  
  const handleNewChat = () => {
    setNewChatKey(Date.now());
  }

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
            onNewChat={handleNewChat}
            onToggleTheme={toggleTheme}
            themeMode={themeMode}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        </div>
      </motion.div>
      
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Routes>
              <Route
                path="/"
                element={<NewPage key={newChatKey} />}
              />
              <Route path="/past-coversation" element={<PastConversation />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
