import { Button, Space, Switch } from 'antd';
import { useNavigate } from 'react-router';
import { FileAddOutlined, BulbOutlined } from "@ant-design/icons";
import { useTheme } from '../contexts/ThemeContext';

function SideBar({ onNewChat }) {
    const navigate = useNavigate()
    const { theme, toggleTheme } = useTheme()

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
                checkedChildren={<BulbOutlined />}
                unCheckedChildren={<BulbOutlined />}
                checked={theme === 'dark'}
                onChange={toggleTheme}
                style={{ marginTop: '10px' }}
            />
        </Space >
    )
}

export default SideBar