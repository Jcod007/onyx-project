import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  availableLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>(() => {
    // Synchroniser avec i18n au lieu d'utiliser notre propre stockage
    const currentLang = i18n.language || localStorage.getItem('i18nextLng') || 'fr';
    return (currentLang.startsWith('fr') ? 'fr' : 'en') as Language;
  });

  const availableLanguages: Language[] = ['fr', 'en'];

  useEffect(() => {
    // Écouter les changements de langue d'i18n
    const handleLanguageChanged = (lng: string) => {
      const newLang = lng.startsWith('fr') ? 'fr' : 'en';
      setLanguageState(newLang as Language);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    
    // S'assurer que i18n est sur la bonne langue
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [language, i18n]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Utiliser uniquement i18n pour la persistance
    i18n.changeLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};