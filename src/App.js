import { useState, useEffect } from "react";
import SideBar from "./components/SideBar";
import NewPage from "./pages/NewPage";
import { Route, Routes } from "react-router-dom";
import PastConversation from "./pages/PastConversation";

function App() {
  const [newChatKey, setNewChatKey] = useState(Date.now());
  const [themeMode, setThemeMode] = useState("dark");


  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    document.body.dataset.theme = themeMode;
    document.body.classList.toggle("dark", themeMode === "dark");
  }, [themeMode]);
  
  const handleNewChat = () => {
    setNewChatKey(Date.now());
  }

  return (
    <div className="flex min-h-screen w-full">
      <div className="w-60 border-r border-gray-200 dark:border-gray-700">
        <SideBar
          onNewChat={handleNewChat}
          onToggleTheme={toggleTheme}
          themeMode={themeMode}
        />
      </div>
      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={<NewPage key={newChatKey} style={{ flexGrow: 1 }} />}
          />
          <Route path="/past-coversation" element={<PastConversation />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
