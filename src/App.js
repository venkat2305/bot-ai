import SideBar from "./components/SideBar";
import './App.css'
import NewPage from "./pages/NewPage";
import { Route, Routes } from "react-router-dom";
import PastConversation from "./pages/PastConversation";

function App() {
  return (
    <div style={{ display: "flex", width: "100%" }}>
      <SideBar />
      <Routes>
        <Route path="/" element={<NewPage style={{ flexGrow: 1 }} />} />
        <Route path="/past-coversation" element={<PastConversation />} />
      </Routes>
    </div>
  );
}

export default App;
