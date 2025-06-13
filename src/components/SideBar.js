import { Button, Space, Switch } from 'antd';
import { useNavigate } from 'react-router';
import { FileAddOutlined } from "@ant-design/icons"; // Removed unused CheckOutlined, CloseOutlined

function SideBar({ onNewChat, currentTheme, toggleTheme, backgroundColor }) {
    const navigate = useNavigate()

    const handleNewChatClick = () => {
        onNewChat();
        navigate('/');
    };

    return (
        <Space
            direction='vertical'
            size="large"
            align='center'
            style={{
                padding: '20px 0', // Adjusted padding
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: backgroundColor, // Apply passed background color
            }}
        >
            <Button 
                icon={<FileAddOutlined />} 
                onClick={handleNewChatClick}
            >
                New Chat
            </Button>
            <Button type="primary" onClick={() => navigate('/past-coversation')}>
                {/* Consider adjusting text color for better contrast if needed, or let AntD handle it */}
                <strong style={{ color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : '#414146' }}>Past Conversations</strong>
            </Button>
            <Space style={{ marginTop: 'auto', paddingBottom: '20px' }}> {/* Added paddingBottom to the inner Space */}
                <Switch
                    checkedChildren="Dark"
                    unCheckedChildren="Light"
                    checked={currentTheme === 'dark'}
                    onChange={toggleTheme}
                />
            </Space>
        </Space >
    )
}

export default SideBar