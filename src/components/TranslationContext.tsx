import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
  enabled: boolean;
}

// Resilient localStorage utility to bypass any iframe sandboxing security restriction crashes
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
};

const DEFAULT_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', enabled: true },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', enabled: true },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳', enabled: true },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳', enabled: true },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳', enabled: true },
  { code: 'te', name: 'Telugu', flag: '🇮🇳', enabled: true },
  { code: 'bn', name: 'Bengali', flag: '🇮🇳', enabled: true },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳', enabled: true },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳', enabled: true },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳', enabled: true }
];

interface TranslationContextType {
  currentLanguage: string;
  languages: LanguageConfig[];
  changeLanguage: (langCode: string) => Promise<void>;
  t: (text: string) => string;
  loading: boolean;
  refreshLanguages: () => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Core static dictionary for zero-latency instant translation of common navigation items
const STATIC_UI_DICTIONARY: Record<string, Record<string, string>> = {
  hi: {
    "Home": "होम",
    "Features": "विशेषताएं",
    "Pricing": "मूल्य निर्धारण",
    "Download Center": "डाउनलोड केंद्र",
    "Tutorials": "ट्यूटोरियल",
    "About Us": "हमारे बारे में",
    "Contact Us": "संपर्क करें",
    "Client Portal": "क्लाइंट पोर्टल",
    "Admin Panel": "एडमिन पैनल",
    "Sign Out Account": "साइन आउट",
    "Logout Account": "खाता लॉगआउट करें",
    "POS Billing System": "पीओएस बिलिंग प्रणाली",
    "GST Billing Software": "जीएसटी बिलिंग सॉफ्टवेयर",
    "Wholesale & Retail Ledger": "थोक और खुदरा बहीखाता",
    "Inventory & Expiry Tracker": "इन्वेंटरी और समाप्ति ट्रैकर",
    "Thermal Receipt Printer Suite": "थर्मल रसीद प्रिंटर सुइट",
    "Customer Support": "ग्राहक सहायता",
    "Software Products": "सॉफ्टवेयर उत्पाद",
    "SSL Secured": "एसएसएल सुरक्षित",
    "UPI / Debit": "यूपीआई / डेबिट"
  },
  mr: {
    "Home": "मुख्यपृष्ठ",
    "Features": "वैशिष्ट्ये",
    "Pricing": "किंमत",
    "Download Center": "डाउनलोड केंद्र",
    "Tutorials": "ट्युटोरियल्स",
    "About Us": "आमच्याबद्दल",
    "Contact Us": "संपर्क साधा",
    "Client Portal": "क्लाइंट पोर्टल",
    "Admin Panel": "अ‍ॅडमिन पॅनेल",
    "Sign Out Account": "साइन आउट",
    "Logout Account": "लॉगआउट करा",
    "POS Billing System": "पीओएस बिलिंग प्रणाली",
    "GST Billing Software": "जीएसटी बिलिंग सॉफ्टवेअर",
    "Wholesale & Retail Ledger": "थोक आणि किरकोळ खातेवही",
    "Inventory & Expiry Tracker": "इन्हेंटरी आणि एक्सपायरी ट्रॅकर"
  },
  gu: {
    "Home": "હોમ",
    "Features": "વિશેષતાઓ",
    "Pricing": "કિંમત",
    "Download Center": "ડાઉનલોડ કેન્દ્ર",
    "Tutorials": "ટ્યુટોરિયલ્સ",
    "About Us": "અમારા વિશે",
    "Contact Us": "સંપર્ક કરો",
    "Client Portal": "ક્લાયંટ પોર્ટલ"
  },
  ta: {
    "Home": "முகப்பு",
    "Features": "அம்சங்கள்",
    "Pricing": "விலை",
    "Download Center": "பதிவிறக்க மையம்",
    "Tutorials": "டுடோரியல்கள்",
    "About Us": "எங்களைப் பற்றி",
    "Contact Us": "தொடர்பு கொள்ள",
    "Client Portal": "வாடிக்கையாளர் போர்ட்டல்"
  },
  te: {
    "Home": "హోమ్",
    "Features": "ఫీచర్లు",
    "Pricing": "ధరలు",
    "Download Center": "డౌన్‌లోడ్ సెంటర్",
    "Tutorials": "ట్యుటోరియల్స్",
    "About Us": "సంప్రదించండి",
    "Contact Us": "సంప్రదించండి"
  }
};

export const TranslationProvider: React.FC<{ children: React.ReactNode; user: any; onUserLanguageLoaded?: (lang: string) => void }> = ({ children, user, onUserLanguageLoaded }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [languages, setLanguages] = useState<LanguageConfig[]>(DEFAULT_LANGUAGES);
  const [loading, setLoading] = useState<boolean>(false);
  const [translationCache, setTranslationCache] = useState<Record<string, Record<string, string>>>(() => {
    const local = safeLocalStorage.getItem('bsp_trans_cache');
    return local ? JSON.parse(local) : {};
  });

  const translationQueue = useRef<string[]>([]);
  const queueTimeout = useRef<any>(null);
  const isTranslating = useRef<boolean>(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const pendingTranslations = useRef<Set<string>>(new Set());
  const failedTranslations = useRef<Set<string>>(new Set());

  // Fetch languages list
  const refreshLanguages = async () => {
    try {
      const res = await fetch('/api/languages');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setLanguages(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch languages list', err);
    }
  };

  // Set loaded preference settings on mount
  useEffect(() => {
    refreshLanguages();
    const saved = safeLocalStorage.getItem('bsp_lang');
    if (saved) {
      setCurrentLanguage(saved);
    }
  }, []);

  // Sync state if user registers or logs in with preferred options saved
  useEffect(() => {
    if (user && user.language) {
      const userLang = user.language.toLowerCase();
      setCurrentLanguage(userLang);
      safeLocalStorage.setItem('bsp_lang', userLang);
      if (onUserLanguageLoaded) {
        onUserLanguageLoaded(userLang);
      }
    }
  }, [user]);

  // Handle switching language preference
  const changeLanguage = async (langCode: string) => {
    const code = langCode.toLowerCase();
    setCurrentLanguage(code);
    safeLocalStorage.setItem('bsp_lang', code);

    // If returning back to English, reload the browser once to refresh original clean English virtual DOM nodes
    if (code === 'en') {
      window.location.reload();
      return;
    }

    // Sync user account settings
    const token = safeLocalStorage.getItem('bsp_token');
    if (user && token) {
      try {
        await fetch('/api/users/language', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ language: code })
        });
      } catch (err) {
        console.error('Failed to sync preferred language in user database model', err);
      }
    }
  };

  // Core translate translator helper
  const t = (text: string): string => {
    if (!text || text.trim() === '') return '';
    const trimmed = text.trim();

    if (currentLanguage === 'en') return text;

    // Check static dictionaries first for 100% zero-latency menu loads
    const staticDic = STATIC_UI_DICTIONARY[currentLanguage];
    if (staticDic && staticDic[trimmed]) {
      return staticDic[trimmed];
    }

    // Check dynamically resolved translations
    const langCache = translationCache[currentLanguage];
    if (langCache && langCache[trimmed]) {
      return langCache[trimmed];
    }

    // Check if translation failed in this session
    if (failedTranslations.current.has(trimmed)) {
      return trimmed;
    }

    // Queue for dynamic extraction from Gemini API
    if (!translationQueue.current.includes(trimmed) && !pendingTranslations.current.has(trimmed)) {
      translationQueue.current.push(trimmed);
      triggerQueueFlush();
    }

    return trimmed; // Temporarily show English while the translation resolves
  };

  // Throttle translation resolver (immune to debounce starvation)
  const triggerQueueFlush = () => {
    if (queueTimeout.current) return; // Already scheduled, let it run

    queueTimeout.current = setTimeout(async () => {
      queueTimeout.current = null;
      const texts = [...translationQueue.current].filter(t => !pendingTranslations.current.has(t));
      if (texts.length === 0) return;

      translationQueue.current = [];
      texts.forEach(t => pendingTranslations.current.add(t));
      setLoading(true);

      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts, targetLanguage: currentLanguage })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.translations && Array.isArray(data.translations)) {
            setTranslationCache(prev => {
              const updated = { ...prev };
              if (!updated[currentLanguage]) {
                updated[currentLanguage] = {};
              }

              let hasNewPersistentTranslation = false;
              texts.forEach((text, i) => {
                const transVal = data.translations[i] || text;
                updated[currentLanguage][text] = transVal;
                
                if (transVal && transVal !== text) {
                  hasNewPersistentTranslation = true;
                } else {
                  // If the translation matches original or fails, mark as failed for the session
                  failedTranslations.current.add(text);
                }
              });

              if (hasNewPersistentTranslation) {
                // Persistent cache in safeLocalStorage (only keep positive translations so we don't pollute cache with failed attempts)
                const cacheToPersist: Record<string, Record<string, string>> = {};
                Object.keys(updated).forEach(lang => {
                  cacheToPersist[lang] = {};
                  Object.keys(updated[lang]).forEach(origKey => {
                    const val = updated[lang][origKey];
                    if (val && val !== origKey) {
                      cacheToPersist[lang][origKey] = val;
                    }
                  });
                });
                safeLocalStorage.setItem('bsp_trans_cache', JSON.stringify(cacheToPersist));
              }

              return updated;
            });
          }
        } else {
          // If the request fails, mark these text keys as failed for the session to prevent retry storms
          texts.forEach(text => failedTranslations.current.add(text));
        }
      } catch (err) {
        console.error('Unable to finalize dynamic background translation', err);
        texts.forEach(text => failedTranslations.current.add(text));
      } finally {
        texts.forEach(text => pendingTranslations.current.delete(text));
        setLoading(false);
      }
    }, 800); // 800ms throttle interval
  };

  // Core loop-safe DOM parser function
  const translateDOM = (root: HTMLElement) => {
    if (currentLanguage === 'en' || isTranslating.current) return;
    isTranslating.current = true;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    try {
      // 1. Traverse static text elements
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            // Reject technical entities, language selectors, code and parameters
            if (
              tag === 'script' || 
              tag === 'style' || 
              tag === 'textarea' || 
              tag === 'noscript' || 
              tag === 'code' || 
              tag === 'pre' ||
              parent.closest('#language-switcher-container') ||
              parent.closest('#language-dropdown-menu')
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let node;
      while (node = walker.nextNode()) {
        const value = node.nodeValue?.trim() || '';
        if (!value || value.length <= 1) continue;

        // Retrieve or store original English text on Node
        let original = (node as any).__originalText;
        if (!original) {
          original = value;
          (node as any).__originalText = original;
        }

        // Skip codes, license references, timestamps, rates, ids and special punctuation
        if (
          isNaN(Number(original)) && 
          !original.startsWith('//') && 
          !original.startsWith('{') && 
          !original.startsWith('₹') && 
          !original.startsWith('u-') && 
          !original.includes('pay_') && 
          !original.includes('lic-') && 
          !original.includes('inv-')
        ) {
          const translated = t(original);
          if (translated && translated !== node.nodeValue) {
            node.nodeValue = translated;
          }
        }
      }

      // 2. Translate Input Placeholders
      const inputs = root.querySelectorAll('input[placeholder], textarea[placeholder]');
      inputs.forEach(el => {
        const input = el as HTMLInputElement | HTMLTextAreaElement;
        let original = input.getAttribute('data-original-placeholder');
        if (!original) {
          original = input.getAttribute('placeholder') || '';
          if (original) {
            input.setAttribute('data-original-placeholder', original);
          }
        }
        if (original && original.trim().length > 1) {
          const translated = t(original);
          const currentPh = input.getAttribute('placeholder');
          if (translated && translated !== currentPh) {
            input.setAttribute('placeholder', translated);
          }
        }
      });

      // 3. Translate titles
      const titles = root.querySelectorAll('[title]');
      titles.forEach(el => {
        let original = el.getAttribute('data-original-title');
        if (!original) {
          original = el.getAttribute('title') || '';
          if (original) {
            el.setAttribute('data-original-title', original);
          }
        }
        if (original && original.trim().length > 1) {
          const translated = t(original);
          const currentTitle = el.getAttribute('title');
          if (translated && translated !== currentTitle) {
            el.setAttribute('title', translated);
          }
        }
      });
    } catch (e) {
      console.error('DOM Auto Translation traversal error:', e);
    } finally {
      isTranslating.current = false;
      if (observerRef.current && currentLanguage !== 'en') {
        const target = document.getElementById('root');
        if (target) {
          observerRef.current.observe(target, {
            childList: true,
            subtree: true
          });
        }
      }
    }
  };

  // Run DOM scan and wire real-time MutationObserver
  useEffect(() => {
    if (currentLanguage === 'en') {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }

    const target = document.getElementById('root');
    if (!target) return;

    // Direct first parse
    translateDOM(target);

    // Setup Mutation Observer to trigger on visual child updates
    if (!observerRef.current) {
      observerRef.current = new MutationObserver(() => {
        translateDOM(target);
      });
    }

    observerRef.current.observe(target, {
      childList: true,
      subtree: true
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentLanguage, translationCache]);

  // Render Alternate SEO tags (hreflang requirements)
  useEffect(() => {
    const existing = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existing.forEach(e => e.remove());

    const enabledLangs = languages.filter(l => l.enabled);
    const origin = window.location.origin;
    const pathname = window.location.pathname;

    enabledLangs.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang.code;
      link.href = `${origin}${pathname}?lang=${lang.code}`;
      document.head.appendChild(link);
    });

    const standard = document.createElement('link');
    standard.rel = 'alternate';
    standard.hreflang = 'x-default';
    standard.href = `${origin}${pathname}`;
    document.head.appendChild(standard);
  }, [languages]);

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
