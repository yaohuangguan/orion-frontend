import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Language } from '../types';
import { resources } from './resources';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (typeof resources)['en'];
}

// Helper for deep merging two objects
const deepMerge = (target: any, source: any): any => {
  if (typeof target !== 'object' || target === null) {
    return source;
  }
  if (typeof source !== 'object' || source === null) {
    return target;
  }

  const output = { ...target };

  Object.keys(source).forEach((key) => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!(key in target)) {
        Object.assign(output, { [key]: source[key] });
      } else {
        output[key] = deepMerge(target[key], source[key]);
      }
    } else {
      Object.assign(output, { [key]: source[key] });
    }
  });

  return output;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state directly from localStorage to ensure cache priority
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('app_language');
      if (savedLang === 'en' || savedLang === 'zh' || savedLang === 'fr' || savedLang === 'zh-HK') {
        return savedLang as Language;
      }
    }
    return 'en';
  });

  const toggleLanguage = () => {
    setLanguage((prev) => {
      let newLang: Language = 'en';
      if (prev === 'en') newLang = 'zh';
      else if (prev === 'zh') newLang = 'zh-HK';
      else if (prev === 'zh-HK') newLang = 'fr';
      else newLang = 'en'; // Cycle back to EN

      localStorage.setItem('app_language', newLang);
      return newLang;
    });
  };

  const setLanguageHandler = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  // Implement automatic fallback to English using deep merge
  const t = useMemo(() => {
    if (language === 'en') {
      return resources.en;
    }
    // Deep merge English keys with current language keys
    // English is the base (target), current language overrides it (source)
    return deepMerge(resources.en, resources[language]);
  }, [language]);

  const value = {
    language,
    setLanguage: setLanguageHandler,
    toggleLanguage,
    t
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
