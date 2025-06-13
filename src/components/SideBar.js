import { Button, Space, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FileAddOutlined } from "@ant-design/icons";

function SideBar({ onNewChat, onToggleTheme, themeMode }) {
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
            <Switch
                checked={themeMode === 'dark'}
                onChange={onToggleTheme}
                checkedChildren="Dark"
                unCheckedChildren="Light"
            />
        </Space >
    )
}

export default SideBar;
