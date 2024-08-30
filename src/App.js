import SideBar from "./components/SideBar";
import './App.css'
import NewPage from "./pages/NewPage";
import { Route, Routes } from "react-router-dom";
import PastConversation from "./pages/PastConversation";
import { Col, Row } from "antd";

function App() {
  return (
    <Row style={{ display: "flex", width: "100%" }}>
      <Col span={3}>
        <SideBar />
      </Col>
      <Col span={21}>
        <Routes>
          <Route path="/" element={<NewPage style={{ flexGrow: 1 }} />} />
          <Route path="/past-coversation" element={<PastConversation />} />
        </Routes>
      </Col>
    </Row>
  );
}

export default App;
