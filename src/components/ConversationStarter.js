import { Card, Typography } from "antd";

function ConversationStarter({ question, subtext, onAsk }) {
    return (
        <Card
            hoverable
            onClick={() => onAsk(question)}
            style={{ background: "var(--card-bg)" }}
        >
            <Typography.Title level={5}>{question}</Typography.Title>
        </Card>
    )
}

export default ConversationStarter;
