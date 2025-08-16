import React, { createContext, useState, ReactNode } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: () => console.warn('setLanguage function not yet initialized'),
});

interface LanguageProviderProps {
  children: ReactNode;
  language: Language;
  setLanguage: (lang?: Language) => void;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children, language, setLanguage }) => {
  
  const handleSetLanguage = (newLang: Language) => {
    setLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};