import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // FORCE DARK - ignore localStorage
  const [theme, setTheme] = useState(() => {
    // Check localStorage
    const saved = localStorage.getItem('eduspantech_theme');
    // If saved is 'dark', use it, otherwise force dark
    if (saved === 'dark') return 'dark';
    // Force dark as default
    return 'dark';
  });

  // Apply theme whenever it changes
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('eduspantech_theme', theme);
    
    // CRITICAL: Remove inline styles from body
    document.body.style.background = '';
    document.body.style.color = '';
    document.body.style.backgroundColor = '';
    
    // Apply data-theme to html element
    document.documentElement.setAttribute('data-theme', theme);
    
    // Force dark theme styles
    if (theme === 'dark') {
      document.documentElement.style.backgroundColor = '#0a0e1a';
      document.body.style.background = '#0a0e1a';
      document.body.style.color = '#ffffff';
    } else {
      document.documentElement.style.backgroundColor = '#f8fafc';
      document.body.style.background = '#f8fafc';
      document.body.style.color = '#0f172a';
    }
    
    console.log('🎨 Theme applied:', theme);
    console.log('📄 data-theme:', document.documentElement.getAttribute('data-theme'));
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;