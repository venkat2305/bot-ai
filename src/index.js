import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfigProvider, theme } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const ThemedConfigProvider = ({ children }) => {
  const { theme: mode } = useTheme();

  const lightTheme = {
    token: {
      fontFamily: 'Ubuntu',
      colorPrimary: '#4a90e2',
      colorBgBase: '#f5f5f5',
      colorTextBase: '#000000'
    },
    algorithm: theme.defaultAlgorithm,
    components: {
      Button: {
        colorPrimary: '#4a90e2',
        colorText: '#fff'
      }
    }
  };

  const darkTheme = {
    token: {
      fontFamily: 'Ubuntu',
      colorPrimary: '#4a90e2',
      colorBgBase: '#1e1e1e',
      colorTextBase: '#e0e0e0'
    },
    algorithm: theme.darkAlgorithm,
    components: {
      Button: {
        colorPrimary: '#4a90e2',
        colorText: '#fff'
      }
    }
  };

  return (
    <ConfigProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      {children}
    </ConfigProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ThemedConfigProvider>
          <App />
        </ThemedConfigProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
