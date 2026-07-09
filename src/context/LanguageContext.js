import React, { createContext, useState, useContext, useEffect } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/languages';

// Create the context
const LanguageContext = createContext();

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Provider component
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState({});

  // Load saved language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('eduspantech-language');
    if (savedLanguage && LANGUAGES[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const module = await import(`../i18n/translations/${currentLanguage}.json`);
        setTranslations(module.default);
        localStorage.setItem('eduspantech-language', currentLanguage);
        document.documentElement.lang = currentLanguage;
        document.documentElement.dir = LANGUAGES[currentLanguage]?.dir || 'ltr';
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to English
        const fallbackModule = await import(`../i18n/translations/en.json`);
        setTranslations(fallbackModule.default);
      }
    };
    loadTranslations();
  }, [currentLanguage]);

  const changeLanguage = (langCode) => {
    if (LANGUAGES[langCode]) {
      setCurrentLanguage(langCode);
    }
  };

  // Get a translation by key (supports nested keys like 'nav.home')
  const t = (key) => {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return key; // Return the key if translation not found
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      changeLanguage,
      t,
      languages: LANGUAGES,
      translations
    }}>
      {children}
    </LanguageContext.Provider>
  );
};