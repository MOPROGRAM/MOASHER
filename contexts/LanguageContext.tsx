import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: { [key in Language]: any } = {
  ar: null,
  en: null,
};

async function loadTranslations(lang: Language) {
  if (!translations[lang]) {
    try {
        const response = await fetch(`/locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load translation file for ${lang}`);
        }
        translations[lang] = await response.json();
    } catch (error) {
        console.error('Error loading translations:', error);
        translations[lang] = {}; // Set to empty object on failure to prevent crashes
    }
  }
  return translations[lang];
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language;
    const browserLang = navigator.language.split('-')[0];
    const initialLang = storedLang || (browserLang === 'ar' ? 'ar' : 'en');
    setLanguage(initialLang);
  }, []);
  
  useEffect(() => {
    loadTranslations(language).then(() => {
        setIsLoaded(true);
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    });
  }, [language]);


  const t = useCallback((key: string, replacements?: { [key: string]: string | number }): string => {
    if (!isLoaded || !translations[language]) {
      return key; 
    }
    let translation = translations[language][key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(rKey => {
            translation = translation.replace(new RegExp(`{{${rKey}}}`, 'g'), String(replacements[rKey]));
        });
    }
    return translation;
  }, [language, isLoaded]);

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {isLoaded ? children : null}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};