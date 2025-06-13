// src/utils/localStorageUtils.js
export const getItem = (key) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : undefined;
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return undefined;
  }
};

export const setItem = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage', error);
  }
};

// Key for storing chat history
const CHAT_HISTORY_KEY = 'chatHistory';

// Function to get chat data from localStorage
export const getChatData = () => {
  // Uses the generic getItem function
  return getItem(CHAT_HISTORY_KEY) || []; // Return empty array if undefined
};

// Function to set chat data in localStorage
export const setChatData = (data) => {
  // Uses the generic setItem function
  setItem(CHAT_HISTORY_KEY, data);
};
