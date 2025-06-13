import { Button, Space } from 'antd';
import { useNavigate } from 'react-router';
import { FileAddOutlined } from "@ant-design/icons";
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function SideBar({ onNewChat }) {
    const navigate = useNavigate()
    const { toggle, mode } = useContext(ThemeContext)

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
            <Button onClick={toggle}>
                Switch to {mode === 'light' ? 'Dark' : 'Light'} Mode
            </Button>
        </Space >
    )
}

export default SideBar