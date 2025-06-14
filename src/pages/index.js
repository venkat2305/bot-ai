import { useContext } from 'react';
import ConversationContainer from '../components/ConversationContainer';
import { NewChatContext } from '../context/NewChatContext';

export default function Home() {
  const { newChatKey } = useContext(NewChatContext);
  return <ConversationContainer key={newChatKey} />;
}
