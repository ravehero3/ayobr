import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    // 1. Check local storage first
    const savedLang = localStorage.getItem('typebeatz_lang');
    if (savedLang) {
      setLanguageState(savedLang);
      return;
    }

    // 2. Fallback to browser language
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('cs') || browserLang.startsWith('sk')) {
      setLanguageState('cs');
    }
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('typebeatz_lang', lang);
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
