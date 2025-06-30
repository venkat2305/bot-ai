const CHAT_STORAGE_KEY = "chatBotData";

export function generateChatId() {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateChatTitle(firstMessage) {
  if (!firstMessage) return "New Chat";
  
  const words = firstMessage.split(' ').slice(0, 6);
  let title = words.join(' ');
  
  if (firstMessage.split(' ').length > 6) {
    title += '...';
  }
  
  return title || "New Chat";
}

export function saveChat(chatData) {
  try {
    const existing = localStorage.getItem(CHAT_STORAGE_KEY);
    let chats = existing ? JSON.parse(existing) : [];
    
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
    
    chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats));
    return true;
  } catch (error) {
    console.error('Error saving chat:', error);
    return false;
  }
}

export function getAllChats() {
  try {
    const existing = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!existing) return [];
    
    const chats = JSON.parse(existing);
    return chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (error) {
    console.error('Error getting chats:', error);
    return [];
  }
}

export function getChatById(chatId) {
  try {
    const chats = getAllChats();
    return chats.find(chat => chat.id === chatId) || null;
  } catch (error) {
    console.error('Error getting chat by ID:', error);
    return null;
  }
}

export function getRecentChats(limit = 15) {
  try {
    const chats = getAllChats();
    return chats.slice(0, limit);
  } catch (error) {
    console.error('Error getting recent chats:', error);
    return [];
  }
}

export function deleteChat(chatId) {
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

export function clearAllChats() {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing chats:', error);
    return false;
  }
}

export function setChatData(sessionData) {
  const chatId = generateChatId();
  const title = generateChatTitle(sessionData[0]?.quesAns);
  
  const chatData = {
    id: chatId,
    title,
    messages: sessionData,
    modelType: 'groq',
    model: 'default'
  };
  
  return saveChat(chatData);
}

export function getChatData() {
  return getAllChats();
}