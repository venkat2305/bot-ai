import { Space, Typography, theme } from "antd"
import { useEffect, useState } from "react"
import ConversationComp from "../components/ConversationComp"
import { getChatData } from "../utils/localStorageUtils";

function PastConversation() {
    const [localData, setLocalData] = useState([])
    const { token } = theme.useToken();

    useEffect(() => {
        const data = getChatData();
        setLocalData(data)
    }, [])

    return (
        <Space
            direction="vertical"
            align="center" // Keep items centered within the Space
            style={{
                backgroundColor: token.colorBgLayout,
                flexGrow: 1,
                padding: token.paddingLG, // Use theme token for padding
                width: '100%', // Ensure Space takes full width
                minHeight: 'calc(100vh - 48px)', // Assuming header/other fixed elements height or ensure parent is full height
            }}>
            <Typography.Title level={4} style={{ color: token.colorTextHeading, marginBottom: token.marginLG }}>Conversation History</Typography.Title>
            {localData.map((chat, index) => ( // Added index for key
                <Space
                    key={index} // Added key for list items
                    direction="vertical"
                    size={0} // No internal spacing, ConversationComp handles its own margins
                    style={{
                        backgroundColor: token.colorBgContainer,
                        borderRadius: token.borderRadiusLG,
                        border: `1px solid ${token.colorBorder}`,
                        padding: token.paddingMD, // Padding inside each chat log
                        marginBottom: token.marginLG, // Spacing between chat logs
                        width: '100%', // Ensure each chat log takes full available width
                        maxWidth: '800px', // Optional: constrain max width for readability
                    }}
                >
                    {chat.map((item, itemIndex) => // Added itemIndex for key
                        <ConversationComp
                            key={item.time + '-' + itemIndex} // More robust key
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

export default PastConversation