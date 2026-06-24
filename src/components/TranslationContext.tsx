import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
  enabled: boolean;
}

interface TranslationContextType {
  currentLanguage: string;
  languages: LanguageConfig[];
  changeLanguage: (langCode: string) => Promise<void>;
  t: (text: string) => string;
  loading: boolean;
  refreshLanguages: () => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const ENGLISH_ONLY_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', enabled: true }
];

export const TranslationProvider: React.FC<{ children: React.ReactNode; user: any; onUserLanguageLoaded?: (lang: string) => void }> = ({ children, user, onUserLanguageLoaded }) => {
  const currentLanguage = 'en';
  const languages = ENGLISH_ONLY_LANGUAGES;
  const loading = false;

  const refreshLanguages = async () => {
    // No-op: Only English is supported
  };

  const changeLanguage = async (langCode: string) => {
    // No-op: Only English is supported
  };

  const t = (text: string): string => {
    return text || '';
  };

  useEffect(() => {
    if (onUserLanguageLoaded) {
      onUserLanguageLoaded('en');
    }
  }, [user?.id]);

  // Handle standard link hreflang standard alternate tags (keep it clean with English x-default)
  useEffect(() => {
    const existing = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existing.forEach(e => e.remove());

    const origin = window.location.origin;
    const pathname = window.location.pathname;

    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = 'en';
    link.href = `${origin}${pathname}`;
    document.head.appendChild(link);

    const standard = document.createElement('link');
    standard.rel = 'alternate';
    standard.hreflang = 'x-default';
    standard.href = `${origin}${pathname}`;
    document.head.appendChild(standard);
  }, []);

  return (
    <TranslationContext.Provider value={{ currentLanguage, languages, changeLanguage, t, loading, refreshLanguages }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
