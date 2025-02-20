import { Button, Space } from 'antd';
import { useNavigate } from 'react-router';
import { FileAddOutlined } from "@ant-design/icons";

function SideBar({ onNewChat }) {
    const navigate = useNavigate()

    const handleNewChatClick = () => {
        onNewChat();
        navigate('/');
    };

    return (
        <Space direction='vertical' size="large" align='center' style={{ marginTop : '20px' }}>
            <Button 
                icon={<FileAddOutlined />} 
                onClick={handleNewChatClick}
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