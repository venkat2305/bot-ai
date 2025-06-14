import '../styles/globals.css';
import SideBar from '../src/components/SideBar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const [newChatKey, setNewChatKey] = useState(Date.now());
  const [themeMode, setThemeMode] = useState('light');
  const router = useRouter();

  useEffect(() => {
    document.body.dataset.theme = themeMode;
  }, [themeMode]);

  const handleNewChat = () => {
    setNewChatKey(Date.now());
    router.push('/');
  };

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
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
        <Component key={router.pathname === '/' ? newChatKey : undefined} {...pageProps} />
      </div>
    </div>
  );
}

export default MyApp;
