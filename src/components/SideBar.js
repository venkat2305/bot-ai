import { PlusCircledIcon } from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";

function SideBar({ onNewChat, onToggleTheme, themeMode }) {
  const navigate = useNavigate();

  const handleNewChatClick = () => {
    onNewChat();
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-5 text-sm">
      <button
        className="flex items-center gap-2 px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
        onClick={handleNewChatClick}
      >
        <PlusCircledIcon />
        New Chat
      </button>
      <button
        className="px-3 py-1 rounded bg-purple-500 text-white hover:bg-purple-600"
        onClick={() => navigate("/past-coversation")}
      >
        <strong>Past Conversations</strong>
      </button>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={themeMode === "dark"}
          onChange={onToggleTheme}
        />
        {themeMode === "dark" ? "Dark" : "Light"}
      </label>
    </div>
  );
}

export default SideBar;
