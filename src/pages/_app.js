import '../index.css';
import { useEffect, useState } from 'react';
import SideBar from '../components/SideBar';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const [newChatKey, setNewChatKey] = useState(Date.now());
  const [themeMode, setThemeMode] = useState('light');
  const router = useRouter();

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.body.dataset.theme = themeMode;
  }, [themeMode]);

  const handleNewChat = () => {
    setNewChatKey(Date.now());
  };

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
        <Component
          key={router.pathname === '/' ? newChatKey : undefined}
          {...pageProps}
        />
      </div>
    </div>
  );
}

export default MyApp;
