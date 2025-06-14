import { useEffect, useState } from "react";
import ConversationComp from "../components/ConversationComp";

function PastConversation() {
  const [localData, setLocalData] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("chatBotData")) || [];
    setLocalData(data);
  }, []);

  return (
    <div className="flex flex-col items-center bg-[var(--bg-body)] flex-1 p-5 gap-3">
      <h2 className="text-lg font-semibold">Conversation History</h2>
      {localData.map((chat, idx) => (
        <div
          key={idx}
          className="flex flex-col gap-1 bg-[var(--card-bg)] rounded p-3 w-full max-w-3xl"
        >
          {chat.map((item, i) => (
            <ConversationComp
              key={i}
              who={item.who}
              time={item.time}
              quesAns={item.quesAns}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default PastConversation;
