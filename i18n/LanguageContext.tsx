
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../types';
import { resources } from './resources';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: typeof resources['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state directly from localStorage to ensure cache priority
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('app_language');
      if (savedLang === 'en' || savedLang === 'zh' || savedLang === 'fr' || savedLang === 'zh-TW') {
        return savedLang as Language;
      }
    }
    return 'en';
  });

  const toggleLanguage = () => {
    setLanguage((prev) => {
      let newLang: Language = 'en';
      if (prev === 'en') newLang = 'zh';
      else if (prev === 'zh') newLang = 'zh-TW';
      else if (prev === 'zh-TW') newLang = 'fr';
      else newLang = 'en'; // Cycle back to EN
      
      localStorage.setItem('app_language', newLang);
      return newLang;
    });
  };

  const setLanguageHandler = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const value = {
    language,
    setLanguage: setLanguageHandler,
    toggleLanguage,
    t: resources[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
