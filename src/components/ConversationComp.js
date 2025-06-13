import { Modal, Rate, Space, Typography, Collapse, Spin } from "antd"
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

    const handleSubmit = () => {
        setShowModal(false)
    }
    const location = useLocation()
    const past = location.pathname === "/past-coversation" ? true : false

    const { reasoning, answer, inProgress } = parseThink(quesAns)

    const style = {
        width: "100%",
        padding: "10px 10px 10px 20px"
    }
    if (!past) {
        style.background = "#eae5f3"
        style.boxShadow = "0px 2px 2px 0 rgba(0,0,0,0.2)"
        style.borderRadius = "10px"
        style.marginBlock = "3px"

    }

    return (
        <Space
            size="large"
            align="start"
            style={style}
        >
            <Modal
                open={showModal}
                title="Provide Additional Feedback"
                onCancel={() => setShowModal(false)}
                onOk={handleSubmit}
            >
                <TextArea autoSize onChange={(e) => updateRatingFeedback(time, rating, e.target.value)} />
            </Modal>
            <div style={{ width: "80px" }}>
                <img src={who === "user" ? userIcon : siteIcon} alt="user-icon" />
            </div>
            <Space direction="vertical">
                <Typography.Text style={{ margin: 0, fontSize: "1.2rem" }} ><strong>{who}</strong></Typography.Text>
                {reasoning && (
                    <Collapse defaultActiveKey={[]} style={{ width: "100%" }}>
                        <Collapse.Panel
                            header={<Space>Thinking {inProgress && <Spin size="small" />}</Space>}
                            key="think"
                        >
                            <Typography.Text style={{ fontFamily: "Open Sans,sans-serif" }}>
                                <ReactMarkdown>{reasoning}</ReactMarkdown>
                            </Typography.Text>
                        </Collapse.Panel>
                    </Collapse>
                )}
                {answer && (
                    <Typography.Text copyable={{ text: answer }} style={{ fontFamily: "Open Sans,sans-serif" }}>
                        <ReactMarkdown>
                            {answer}
                        </ReactMarkdown>
                    </Typography.Text>
                )}
                <Space size="large" >
                    <Typography.Text style={{ fontFamily: "Open Sans,sans-serif" }}>{time.split(',')[1]}</Typography.Text>
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

export default ConversationComp;

