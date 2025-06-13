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
                background: "linear-gradient(180deg, rgba(215, 199, 244, 0.2) 0%, rgba(151, 133, 186, 0.2) 100%)",
                flexGrow: 1,
                padding: "20px"
            }}>
            <Typography.Title level={4}>Conversation History</Typography.Title>
            {localData.map(chat => (
                <Space direction="vertical" size={0} style={{
                    borderRadius: "10px",
                    background: "linear-gradient(90deg, #BFACE2 0%, #D7C7F4 100%)"
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
