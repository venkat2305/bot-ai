import { useState } from "react";
import SideBar from "./components/SideBar";
import './App.css'
import NewPage from "./pages/NewPage";
import { Route, Routes } from "react-router-dom";
import PastConversation from "./pages/PastConversation";
import { Col, Row, ConfigProvider } from "antd";

function App() {
  const [newChatKey, setNewChatKey] = useState(Date.now());
  const { token } = ConfigProvider.useToken();
  
  const handleNewChat = () => {
    setNewChatKey(Date.now());
  }

  return (
    <Row style={{ display: "flex", width: "100%", minHeight: "100vh", background: token.colorBgBase, color: token.colorTextBase }}>
      <Col span={3}>
        <SideBar onNewChat={handleNewChat} />
      </Col>
      <Col span={21}>
        <Routes>
          <Route path="/" element={<NewPage key={newChatKey} style={{ flexGrow: 1 }} />} />
          <Route path="/past-coversation" element={<PastConversation />} />
        </Routes>
      </Col>
    </Row>
  );
}

export default App;
