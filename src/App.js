import { useState, useEffect } from "react";
import SideBar from "./components/SideBar";
import './App.css'
import NewPage from "./pages/NewPage";
import { Route, Routes } from "react-router-dom";
import PastConversation from "./pages/PastConversation";
import { Col, Row, ConfigProvider, theme as antdTheme } from "antd";

function App() {
  const [newChatKey, setNewChatKey] = useState(Date.now());
  const [themeMode, setThemeMode] = useState("light");

  const tokens = {
    light: {
      colorPrimary: "#722ed1",
      colorText: "#000",
      colorBgBase: "#f5f5f5",
      fontFamily: "Ubuntu",
    },
    dark: {
      colorPrimary: "#9254de",
      colorText: "#f5f5f5",
      colorBgBase: "#141414",
      fontFamily: "Ubuntu",
    },
  };

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    document.body.dataset.theme = themeMode;
  }, [themeMode]);
  
  const handleNewChat = () => {
    setNewChatKey(Date.now());
  }

  return (
    <ConfigProvider
      theme={{
        algorithm:
          themeMode === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: tokens[themeMode],
      }}
    >
      <Row style={{ display: "flex", width: "100%" }}>
        <Col span={3}>
          <SideBar
            onNewChat={handleNewChat}
            onToggleTheme={toggleTheme}
            themeMode={themeMode}
          />
        </Col>
        <Col span={21}>
          <Routes>
            <Route
              path="/"
              element={<NewPage key={newChatKey} style={{ flexGrow: 1 }} />}
            />
            <Route path="/past-coversation" element={<PastConversation />} />
          </Routes>
        </Col>
      </Row>
    </ConfigProvider>
  );
}

export default App;
