import { createContext } from 'react';

export const NewChatContext = createContext({
  newChatKey: Date.now(),
  handleNewChat: () => {},
});
