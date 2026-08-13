import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { LanguageProvider } from './context/LanguageContext';
import { SessionSettingsProvider } from './context/SessionSettingsContext';
import { ThemeProvider } from './context/ThemeContext';

// ============================================
// ✅ FORCE DARK THEME - Runs BEFORE React loads
// ============================================

// 1. Remove any inline styles from body
document.body.style.background = '';
document.body.style.color = '';
document.body.style.backgroundColor = '';

// 2. Set data-theme on html
document.documentElement.setAttribute('data-theme', 'dark');

// 3. Force dark colors
document.documentElement.style.backgroundColor = '#0a0e1a';
document.body.style.background = '#0a0e1a';
document.body.style.color = '#ffffff';

// 4. Save to localStorage
localStorage.setItem('eduspantech_theme', 'dark');

console.log('🌙 Force dark theme applied at load');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <SessionSettingsProvider>
          <App />
        </SessionSettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();"// FORCE NEW BUILD $(date +%s)" 
