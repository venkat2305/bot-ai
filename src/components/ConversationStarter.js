import { Card, Typography } from "antd";

function ConversationStarter({ question, subtext, onAsk }) {
    return (
        <Card hoverable onClick={() => onAsk(question)} style={{background : "#d7c7f4"}}>
            <Typography.Title level={5}>{question}</Typography.Title>
            <Typography.Text style={{ fontFamily: 'Open Sans' }} type="secondary">{subtext}</Typography.Text>
        </Card>
    )
}

export default ConversationStarter