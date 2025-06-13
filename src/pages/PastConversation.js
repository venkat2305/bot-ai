import { Space, Typography } from "antd"
import { useEffect, useState } from "react"
import ConversationComp from "../components/ConversationComp"

function PastConversation() {
    const [localData, setLocalData] = useState([])

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem("chatBotData")) || []
        setLocalData(data)
    }, [])

    return (
        <Space
            direction="vertical"
            align="center"
            style={{
                background: "var(--bg-body)",
                flexGrow: 1,
                padding: "20px"
            }}>
            <Typography.Title level={4}>Conversation History</Typography.Title>
            {localData.map(chat => (
                <Space direction="vertical" size={0} style={{
                    borderRadius: "10px",
                    background: "var(--card-bg)"
                }}>
                    {chat.map(item =>
                        <ConversationComp
                            who={item.who}
                            time={item.time}
                            quesAns={item.quesAns}
                            rating={item.rating}
                            feedback={item.feedback}
                        />)}
                </Space>
            ))}

        </Space>
    )
}

export default PastConversation;
