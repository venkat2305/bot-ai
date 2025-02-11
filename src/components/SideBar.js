import { Button, Space, Typography } from 'antd';
import siteIcon from '../assets/site-icon.png';
import newEditIcon from '../assets/new-edit.png'
import { useNavigate } from 'react-router';
import { FileAddOutlined } from "@ant-design/icons";

function SideBar({ onNewChat }) {
    const { Text } = Typography
    const navigate = useNavigate()
    return (
        <Space direction='vertical' size="large" align='center' style={{ width: "" }}>
            <Space align='center' style={{
                backgroundColor: "#d7c7f4",
                width: "100%",
                padding: "5px 15px",
            }}>
                <img width="40px" src={siteIcon} alt="site icon" />
                <Text style={{ fontSize: "1.1rem" }}>New Chat</Text>
                {/* <img style={{cursor : "pointer"}} src={newEditIcon} onClick={() => navigate('/')} alt='new chat'/> */}
            </Space>
            <Button 
                icon={<FileAddOutlined />} 
                onClick={onNewChat}
            >
                New Chat
            </Button>
            <Button type="primary" onClick={() => navigate('/past-coversation')}>
                <strong style={{ color: "#414146" }}>Past Conversations</strong>
            </Button>
        </Space >
    )
}

export default SideBar