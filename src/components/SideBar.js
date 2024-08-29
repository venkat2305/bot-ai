import { Button, Space, Typography } from 'antd';
import siteIcon from '../assets/site-icon.png';
import newEditIcon from '../assets/new-edit.png'
import { useNavigate } from 'react-router';

function SideBar() {
    const { Text } = Typography
    const navigate = useNavigate()
    return (
        <Space direction='vertical'>
            <Space align='center' style={{ backgroundColor: "#d7c7f4" }}>
                <img width="30px" src={siteIcon} alt="site icon" />
                <Text>New Chat</Text>
                <img src={newEditIcon} />
            </Space>
            <Button type="primary" onClick={() => navigate('/past-coversation')}>
                <strong style={{ color: "#414146" }}>Past Conversations</strong>
            </Button>

        </Space >
    )
}

export default SideBar