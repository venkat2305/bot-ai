import React, { createContext, useState } from 'react';

export const ThemeContext = createContext({
  mode: 'light',
  toggle: () => {}
});

export default function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  const toggle = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
