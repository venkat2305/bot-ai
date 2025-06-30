import { Chat, Message } from "../hooks/useConversation";

const CHAT_STORAGE_KEY = "chatBotData";

export interface StoredChat extends Chat {
  createdAt: string;
  updatedAt: string;
}

export function generateChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateChatTitle(firstMessage?: string): string {
  if (!firstMessage) return "New Chat";
  
  const words = firstMessage.split(' ').slice(0, 6);
  let title = words.join(' ');
  
  if (firstMessage.split(' ').length > 6) {
    title += '...';
  }
  
  return title || "New Chat";
}

export function saveChat(chatData: Chat): boolean {
  try {
    const existing = localStorage.getItem(CHAT_STORAGE_KEY);
    let chats: StoredChat[] = existing ? JSON.parse(existing) : [];
    
    const existingIndex = chats.findIndex(chat => chat.id === chatData.id);
    
    if (existingIndex >= 0) {
      chats[existingIndex] = {
        ...chats[existingIndex],
        ...chatData,
        updatedAt: new Date().toISOString()
      };
    } else {
      chats.unshift({
        ...chatData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats));
    return true;
  } catch (error) {
    console.error('Error saving chat:', error);
    return false;
  }
}

export function getAllChats(): StoredChat[] {
  try {
    const existing = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!existing) return [];
    
    const chats: StoredChat[] = JSON.parse(existing);
    return chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error('Error getting chats:', error);
    return [];
  }
}

export function getChatById(chatId: string): StoredChat | null {
  try {
    const chats = getAllChats();
    return chats.find(chat => chat.id === chatId) || null;
  } catch (error) {
    console.error('Error getting chat by ID:', error);
    return null;
  }
}

export function getRecentChats(limit: number = 15): StoredChat[] {
  try {
    const chats = getAllChats();
    return chats.slice(0, limit);
  } catch (error) {
    console.error('Error getting recent chats:', error);
    return [];
  }
}

export function deleteChat(chatId: string): boolean {
  try {
    const chats = getAllChats();
    const filtered = chats.filter(chat => chat.id !== chatId);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting chat:', error);
    return false;
  }
}

export function clearAllChats(): boolean {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing chats:', error);
    return false;
  }
}

export function setChatData(sessionData: Message[]): boolean {
  const chatId = generateChatId();
  const title = generateChatTitle(sessionData[0]?.quesAns);
  
  const chatData: Chat = {
    id: chatId,
    title,
    messages: sessionData,
    modelType: 'groq',
    model: 'default'
  };
  
  return saveChat(chatData);
}

export function getChatData(): StoredChat[] {
  return getAllChats();
}