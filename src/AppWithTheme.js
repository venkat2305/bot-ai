import React, { useContext, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import { ThemeContext } from './context/ThemeContext';

export default function AppWithTheme() {
  const { mode } = useContext(ThemeContext);
  const isDark = mode === 'dark';

  useEffect(() => {
    document.body.className = isDark ? 'dark' : 'light';
  }, [isDark]);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#7f5af0',
          fontFamily: 'Ubuntu',
        },
        components: {
          Button: {
            colorPrimary: '#7f5af0',
            colorText: isDark ? '#f1f1f1' : '#1f1f1f',
          },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  );
}
