import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Automatically detect domain entry point, query param (?lang=es), or path (/es)
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang') || urlParams.get('locale');
      if (langParam === 'es' || langParam === 'spanish') return 'es';
      if (langParam === 'en' || langParam === 'english') return 'en';

      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/es') || path.includes('/spanish')) return 'es';

      const host = window.location.hostname.toLowerCase();
      if (host.startsWith('es.') || host.includes('-es-') || host.includes('spanish')) {
        return 'es';
      }
    }
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
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

