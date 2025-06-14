import { useState, useEffect } from 'react';
import SideBar from './SideBar';
import { NewChatContext } from '../context/NewChatContext';

export default function Layout({ children }) {
  const [newChatKey, setNewChatKey] = useState(Date.now());
  const [themeMode, setThemeMode] = useState('light');

  const handleNewChat = () => setNewChatKey(Date.now());
  const toggleTheme = () => setThemeMode(prev => (prev === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    document.body.dataset.theme = themeMode;
  }, [themeMode]);

  return (
    <NewChatContext.Provider value={{ newChatKey, handleNewChat }}>
      <div className="flex min-h-screen w-full">
        <div className="w-60 border-r border-gray-200 dark:border-gray-700">
          <SideBar onToggleTheme={toggleTheme} themeMode={themeMode} />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </NewChatContext.Provider>
  );
}
