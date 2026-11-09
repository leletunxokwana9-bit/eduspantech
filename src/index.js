// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './hooks/useAuth';

// ===== POLYFILL FOR ENVIRONMENT VARIABLES =====
if (typeof process !== 'undefined' && process.env) {
  if (!process.env.REACT_APP_API_URL) {
    process.env.REACT_APP_API_URL = 'https://eduspantech-backend.onrender.com/api';
  }
  if (!process.env.REACT_APP_SUPABASE_URL) {
    process.env.REACT_APP_SUPABASE_URL = 'https://dokwmteucrhajourpthf.supabase.co';
  }
  if (!process.env.REACT_APP_SUPABASE_ANON_KEY) {
    process.env.REACT_APP_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRva3dtdGV1Y3JoYWpvdXJwdGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTc2NzgsImV4cCI6MjA5OTQzMzY3OH0.R7hQVGrZTSdWeiyL3Ve6Wk00OuWKpZkCeWnZLbGY-hg';
  }
}

console.log('🚀 App starting...');
console.log('📋 API URL from env:', process.env.REACT_APP_API_URL);
console.log('📋 Supabase URL from env:', process.env.REACT_APP_SUPABASE_URL);
console.log('📋 Supabase Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);

// ===== FETCH INTERCEPTOR =====
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  if (typeof url === 'string') {
    if (url.includes('[SENSITIVE]')) {
      console.log('🔧 Fetch interceptor: Replacing [SENSITIVE] in URL');
      const apiUrl = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';
      url = url.replace(/\[SENSITIVE\]/g, apiUrl);
      console.log('🔧 New URL:', url);
    }
    if (url.includes('[API_URL]')) {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';
      url = url.replace(/\[API_URL\]/g, apiUrl);
    }
    if (url.includes('[SUPABASE_URL]')) {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dokwmteucrhajourpthf.supabase.co';
      url = url.replace(/\[SUPABASE_URL\]/g, supabaseUrl);
    }
  }
  return originalFetch.call(this, url, options);
};

// ===== GLOBAL REFS =====
if (typeof window !== 'undefined') {
  window.__API_URL = process.env.REACT_APP_API_URL;
  window.__SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
  window.__SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (window['[SENSITIVE]']) {
    console.log('🔧 Overriding window.[SENSITIVE]');
    window['[SENSITIVE]'] = process.env.REACT_APP_API_URL;
  }
  if (window.SENSITIVE) {
    console.log('🔧 Overriding window.SENSITIVE');
    window.SENSITIVE = process.env.REACT_APP_API_URL;
  }
}

// ===== RENDER APP =====
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

reportWebVitals();