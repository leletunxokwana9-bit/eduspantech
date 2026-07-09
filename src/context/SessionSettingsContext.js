import React, { createContext, useState, useContext, useEffect } from 'react';

const SessionSettingsContext = createContext();

export const SessionSettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('session-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('session-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <SessionSettingsContext.Provider value={value}>
      {children}
    </SessionSettingsContext.Provider>
  );
};

export const useSessionSettings = () => {
  const context = useContext(SessionSettingsContext);
  if (!context) {
    throw new Error('useSessionSettings must be used within SessionSettingsProvider');
  }
  return context;
};