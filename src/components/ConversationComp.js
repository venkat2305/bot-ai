import { Modal, Rate, Space, Typography, Collapse, Spin, theme } from "antd"
import userIcon from '../assets/user-icon.png'
import siteIcon from '../assets/site-icon.png'
import { DislikeOutlined, LikeOutlined } from "@ant-design/icons"
import { useState } from "react"
import TextArea from "antd/es/input/TextArea"
import { useLocation } from "react-router"
import ReactMarkdown from 'react-markdown';

function parseThink(text) {
    const start = text.indexOf('<think>');
    const end = text.indexOf('</think>');
    let reasoning = '';
    let answer = text;
    let inProgress = false;

    if (start !== -1) {
        if (end !== -1 && end > start) {
            reasoning = text.slice(start + 7, end);
            answer = (text.slice(0, start) + text.slice(end + 8)).trim();
        } else {
            reasoning = text.slice(start + 7);
            answer = text.slice(0, start).trim();
            inProgress = true;
        }
    }

    return { reasoning, answer, inProgress };
}

function ConversationComp({ who, quesAns, time, updateRatingFeedback, rating, feedback }) {
    const [showRating, setShowRating] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const { token } = theme.useToken();

    const handleSubmit = () => {
        setShowModal(false)
    }
    const location = useLocation()
    const past = location.pathname === "/past-coversation" ? true : false

    const { reasoning, answer, inProgress } = parseThink(quesAns)

    const isUser = who === "user";

    const bubbleStyle = {
        width: "100%",
        padding: "10px 15px", // Adjusted padding
        borderRadius: "10px",
        marginBlock: "5px", // Adjusted margin
    };

    if (!past) {
        if (isUser) {
            bubbleStyle.background = token.colorPrimaryBg;
            bubbleStyle.color = token.colorPrimaryText; // For text within this bubble
        } else {
            bubbleStyle.background = token.colorBgContainer; // Bot's background
            bubbleStyle.color = token.colorText; // For text within this bubble
        }
        // Consider adding a subtle shadow from the theme if available, e.g., token.boxShadowSecondary
        // bubbleStyle.boxShadow = "0px 2px 2px 0 rgba(0,0,0,0.1)"; // Softer shadow
    } else {
        // Styles for past conversation view, might need different theming if they appear on a different background
        bubbleStyle.border = `1px solid ${token.colorBorder}`;
    }

    const labelColor = isUser ? token.colorPrimaryTextActive : token.colorTextSecondary;
    const textColor = isUser ? token.colorPrimaryText : token.colorText;

    return (
        <Space
            size="large"
            align="start"
            style={bubbleStyle}
        >
            <Modal
                open={showModal}
                title="Provide Additional Feedback"
                onCancel={() => setShowModal(false)}
                onOk={handleSubmit}
            >
                <TextArea autoSize onChange={(e) => updateRatingFeedback(time, rating, e.target.value)} />
            </Modal>
            <div style={{ width: "80px", paddingTop: '5px' }}> {/* Minor adjustment for icon alignment */}
                <img src={isUser ? userIcon : siteIcon} alt="user-icon" />
            </div>
            <Space direction="vertical" style={{ width: '100%' }}> {/* Ensure vertical space takes full width */}
                <Typography.Text style={{ margin: 0, fontSize: "1.2rem", color: labelColor }} ><strong>{who}</strong></Typography.Text>
                {reasoning && (
                    <Collapse defaultActiveKey={[]} style={{ width: "100%" }}>
                        <Collapse.Panel
                            header={<Space>Thinking {inProgress && <Spin size="small" />}</Space>}
                            key="think"
                        >
                            <Typography.Text style={{ fontFamily: "Open Sans,sans-serif", color: textColor }}>
                                <ReactMarkdown>{reasoning}</ReactMarkdown>
                            </Typography.Text>
                        </Collapse.Panel>
                    </Collapse>
                )}
                {answer && (
                    <Typography.Text copyable={{ text: answer }} style={{ fontFamily: "Open Sans,sans-serif", color: textColor, whiteSpace: 'pre-wrap' }}>
                        <ReactMarkdown>
                            {answer}
                        </ReactMarkdown>
                    </Typography.Text>
                )}
                <Space size="large" >
                    <Typography.Text style={{ fontFamily: "Open Sans,sans-serif", color: textColor }}>{time.split(',')[1]}</Typography.Text>
                    {who != "user" && !past && (
                        <Space size="large">
                            <LikeOutlined onClick={() => setShowRating(prev => !prev)} />
                            <DislikeOutlined onClick={() => setShowModal(true)} />
                        </Space>
                    )}
                </Space>
                {showRating &&
                    <Rate
                        value={rating}
                        onChange={(ratingVal) => updateRatingFeedback(time, ratingVal, "")}
                    />}
                {past && feedback && <Typography.Text> <strong>Feedback</strong>:  {feedback} </Typography.Text>}
            </Space>
        </Space>
    )
}

export default ConversationComp
