import { useState, useEffect } from "react";
import SideBar from "./components/SideBar";
import './App.css'
import NewPage from "./pages/NewPage";
import { Route, Routes } from "react-router-dom";
import PastConversation from "./pages/PastConversation";
import { Col, Row, ConfigProvider, theme } from "antd";
import { getItem, setItem } from "./utils/localStorageUtils";

const { useToken } = theme;

// Define custom theme objects
const lightTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1677ff',
    colorBgLayout: '#f0f2f5',
    colorBgContainer: '#ffffff',
    colorTextBase: 'rgba(0, 0, 0, 0.88)',
    colorBorder: '#d9d9d9',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
  },
};

const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#177ddc',
    colorBgLayout: '#141414',
    colorBgContainer: '#1f1f1f',
    colorTextBase: 'rgba(255, 255, 255, 0.85)',
    colorBorder: '#424242',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
  },
};

function AppContent({ currentTheme, toggleTheme, onNewChat, newChatKey }) {
  const { token } = useToken();

  return (
    <Row style={{ display: "flex", width: "100%", minHeight: '100vh', backgroundColor: token.colorBgLayout }}>
      <Col span={3} style={{ backgroundColor: token.colorBgLayout }}> {/* Sidebar column takes layout background */}
        <SideBar
          onNewChat={onNewChat}
          currentTheme={currentTheme}
          toggleTheme={toggleTheme}
          backgroundColor={token.colorBgContainer} // Sidebar itself takes container background
        />
      </Col>
      <Col span={21} style={{ backgroundColor: token.colorBgContainer, padding: '24px' }}> {/* Main content area takes container background */}
        <Routes>
          <Route path="/" element={<NewPage key={newChatKey} style={{ flexGrow: 1 }} />} />
          <Route path="/past-coversation" element={<PastConversation />} />
        </Routes>
      </Col>
    </Row>
  );
}

function App() {
  const [newChatKey, setNewChatKey] = useState(Date.now());
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    const storedTheme = getItem('theme');
    if (storedTheme) {
      setCurrentTheme(storedTheme);
    } else {
      setItem('theme', 'light'); // Default to light and store it
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    setItem('theme', newTheme);
  };

  const handleNewChat = () => {
    setNewChatKey(Date.now());
  };

  return (
    <ConfigProvider theme={currentTheme === 'light' ? lightTheme : darkTheme}>
      <AppContent
        currentTheme={currentTheme}
        toggleTheme={toggleTheme}
        onNewChat={handleNewChat}
        newChatKey={newChatKey}
      />
    </ConfigProvider>
  );
}

export default App;
