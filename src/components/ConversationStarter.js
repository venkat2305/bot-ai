import { Card, Typography } from "antd";

function ConversationStarter({ question, subtext }) {
    return (
        <Card hoverable >
            <Typography.Title level={5}>{question}</Typography.Title>
            <Typography.Text style={{ fontFamily: 'Open Sans' }} type="secondary">{subtext}</Typography.Text>
        </Card>
    )
}

export default ConversationStarter