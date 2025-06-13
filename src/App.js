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
        token: {
          colorPrimary: "#8a2be2",
          fontFamily: "Ubuntu",
        },
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
