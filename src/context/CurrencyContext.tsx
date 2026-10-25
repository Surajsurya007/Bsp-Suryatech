import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rateVsUSD: number;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rateVsUSD: 1.0, decimals: 0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rateVsUSD: 1.0, decimals: 0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rateVsUSD: 0.92, decimals: 0 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rateVsUSD: 0.77, decimals: 0 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', rateVsUSD: 1.38, decimals: 0 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rateVsUSD: 1.52, decimals: 0 },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', flag: '🇦🇪', rateVsUSD: 3.67, decimals: 0 },
  SAR: { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal', flag: '🇸🇦', rateVsUSD: 3.75, decimals: 0 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', rateVsUSD: 1.32, decimals: 0 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rateVsUSD: 152.0, decimals: 0 },
  MYR: { code: 'MYR', symbol: 'RM ', name: 'Malaysian Ringgit', flag: '🇲🇾', rateVsUSD: 4.42, decimals: 0 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', rateVsUSD: 1.68, decimals: 0 },
  ZAR: { code: 'ZAR', symbol: 'R ', name: 'South African Rand', flag: '🇿🇦', rateVsUSD: 17.80, decimals: 0 },
  BRL: { code: 'BRL', symbol: 'R$ ', name: 'Brazilian Real', flag: '🇧🇷', rateVsUSD: 5.70, decimals: 0 },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭', rateVsUSD: 57.50, decimals: 0 },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩', rateVsUSD: 120.0, decimals: 0 },
  PKR: { code: 'PKR', symbol: 'Rs ', name: 'Pakistani Rupee', flag: '🇵🇰', rateVsUSD: 278.0, decimals: 0 },
  NPR: { code: 'NPR', symbol: 'NRs ', name: 'Nepalese Rupee', flag: '🇳🇵', rateVsUSD: 133.0, decimals: 0 },
  LKR: { code: 'LKR', symbol: 'Rs ', name: 'Sri Lankan Rupee', flag: '🇱🇰', rateVsUSD: 295.0, decimals: 0 },
  KWD: { code: 'KWD', symbol: 'KD ', name: 'Kuwaiti Dinar', flag: '🇰🇼', rateVsUSD: 0.31, decimals: 0 },
  QAR: { code: 'QAR', symbol: 'QAR ', name: 'Qatari Riyal', flag: '🇶🇦', rateVsUSD: 3.64, decimals: 0 },
  OMR: { code: 'OMR', symbol: 'OMR ', name: 'Omani Rial', flag: '🇴🇲', rateVsUSD: 0.38, decimals: 0 },
  BHD: { code: 'BHD', symbol: 'BD ', name: 'Bahraini Dinar', flag: '🇧🇭', rateVsUSD: 0.38, decimals: 0 }
};

// Eurozone country codes
const EUROZONE_COUNTRIES = new Set([
  'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'PT', 'IE', 'AT', 'FI', 'GR', 
  'EE', 'LV', 'LT', 'SK', 'SI', 'LU', 'CY', 'MT', 'MC', 'SM', 'VA'
]);

interface CurrencyContextType {
  currency: string;
  currencyInfo: CurrencyInfo;
  detectedCountry: string;
  detectedCountryCode: string;
  isAutoDetected: boolean;
  setCurrency: (currencyCode: string) => void;
  formatPrice: (inrValue: number | string | undefined | null, isOriginal?: boolean) => string;
  getNumericPrice: (inrValue: number | string | undefined | null, isOriginal?: boolean) => number;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>('INR');
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const initRates: Record<string, number> = {};
    for (const [k, v] of Object.entries(SUPPORTED_CURRENCIES)) {
      initRates[k] = v.rateVsUSD;
    }
    return initRates;
  });
  const [detectedCountry, setDetectedCountry] = useState<string>('India');
  const [detectedCountryCode, setDetectedCountryCode] = useState<string>('IN');
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(true);

  // Initialize and auto-detect country/currency
  useEffect(() => {
    // 1. Check user manual override
    const saved = localStorage.getItem('bsp_user_currency');
    if (saved && SUPPORTED_CURRENCIES[saved]) {
      setCurrencyState(saved);
      setIsAutoDetected(false);
    } else {
      // 2. Initial timezone detection
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz === 'Asia/Colombo') {
          setDetectedCountry('India');
          setDetectedCountryCode('IN');
          setCurrencyState('INR');
        } else if (tz.startsWith('America/New_York') || tz.startsWith('America/Los_Angeles') || tz.startsWith('America/Chicago') || tz.startsWith('America/Denver') || tz.startsWith('America/Phoenix')) {
          setDetectedCountry('United States');
          setDetectedCountryCode('US');
          setCurrencyState('USD');
        } else if (tz.startsWith('Europe/London')) {
          setDetectedCountry('United Kingdom');
          setDetectedCountryCode('GB');
          setCurrencyState('GBP');
        } else if (tz.startsWith('Europe/Paris') || tz.startsWith('Europe/Berlin') || tz.startsWith('Europe/Rome') || tz.startsWith('Europe/Madrid') || tz.startsWith('Europe/Amsterdam')) {
          setDetectedCountry('Europe');
          setDetectedCountryCode('DE');
          setCurrencyState('EUR');
        } else if (tz.startsWith('America/Toronto') || tz.startsWith('America/Vancouver') || tz.startsWith('America/Montreal')) {
          setDetectedCountry('Canada');
          setDetectedCountryCode('CA');
          setCurrencyState('CAD');
        } else if (tz.startsWith('Australia/')) {
          setDetectedCountry('Australia');
          setDetectedCountryCode('AU');
          setCurrencyState('AUD');
        } else if (tz.startsWith('Asia/Dubai')) {
          setDetectedCountry('United Arab Emirates');
          setDetectedCountryCode('AE');
          setCurrencyState('AED');
        } else if (tz.startsWith('Asia/Riyadh')) {
          setDetectedCountry('Saudi Arabia');
          setDetectedCountryCode('SA');
          setCurrencyState('SAR');
        } else if (tz.startsWith('Asia/Singapore')) {
          setDetectedCountry('Singapore');
          setDetectedCountryCode('SG');
          setCurrencyState('SGD');
        } else if (tz.startsWith('Asia/Tokyo')) {
          setDetectedCountry('Japan');
          setDetectedCountryCode('JP');
          setCurrencyState('JPY');
        } else {
          // Default international base is USD
          setDetectedCountry('International');
          setDetectedCountryCode('US');
          setCurrencyState('USD');
        }
      } catch (e) {
        setCurrencyState('INR');
      }
    }

    // 3. Background refined IP Geolocation check (free public endpoints)
    const detectLocationViaApi = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        // Try api.country.is first (lightweight & ultra fast)
        let countryCode = '';
        try {
          const res = await fetch('https://api.country.is/', { signal: controller.signal });
          if (res.ok) {
            const data = await res.json();
            if (data?.country) countryCode = data.country.toUpperCase();
          }
        } catch {
          // Fallback to ipapi.co
          try {
            const res2 = await fetch('https://ipapi.co/json/', { signal: controller.signal });
            if (res2.ok) {
              const data2 = await res2.json();
              if (data2?.country_code) countryCode = data2.country_code.toUpperCase();
            }
          } catch {}
        } finally {
          clearTimeout(timeoutId);
        }

        if (countryCode) {
          setDetectedCountryCode(countryCode);
          let matchedCurrency = 'USD';
          let countryName = countryCode;

          if (countryCode === 'IN') {
            matchedCurrency = 'INR';
            countryName = 'India';
          } else if (countryCode === 'US') {
            matchedCurrency = 'USD';
            countryName = 'United States';
          } else if (countryCode === 'GB') {
            matchedCurrency = 'GBP';
            countryName = 'United Kingdom';
          } else if (EUROZONE_COUNTRIES.has(countryCode)) {
            matchedCurrency = 'EUR';
            countryName = 'European Union';
          } else if (countryCode === 'CA') {
            matchedCurrency = 'CAD';
            countryName = 'Canada';
          } else if (countryCode === 'AU') {
            matchedCurrency = 'AUD';
            countryName = 'Australia';
          } else if (countryCode === 'AE') {
            matchedCurrency = 'AED';
            countryName = 'United Arab Emirates';
          } else if (countryCode === 'SA') {
            matchedCurrency = 'SAR';
            countryName = 'Saudi Arabia';
          } else if (countryCode === 'SG') {
            matchedCurrency = 'SGD';
            countryName = 'Singapore';
          } else if (countryCode === 'JP') {
            matchedCurrency = 'JPY';
            countryName = 'Japan';
          } else if (countryCode === 'MY') {
            matchedCurrency = 'MYR';
            countryName = 'Malaysia';
          } else if (countryCode === 'NZ') {
            matchedCurrency = 'NZD';
            countryName = 'New Zealand';
          } else if (countryCode === 'ZA') {
            matchedCurrency = 'ZAR';
            countryName = 'South Africa';
          } else if (countryCode === 'BR') {
            matchedCurrency = 'BRL';
            countryName = 'Brazil';
          } else if (countryCode === 'PH') {
            matchedCurrency = 'PHP';
            countryName = 'Philippines';
          } else if (countryCode === 'BD') {
            matchedCurrency = 'BDT';
            countryName = 'Bangladesh';
          } else if (countryCode === 'PK') {
            matchedCurrency = 'PKR';
            countryName = 'Pakistan';
          } else if (countryCode === 'NP') {
            matchedCurrency = 'NPR';
            countryName = 'Nepal';
          } else if (countryCode === 'LK') {
            matchedCurrency = 'LKR';
            countryName = 'Sri Lanka';
          } else if (countryCode === 'KW') {
            matchedCurrency = 'KWD';
            countryName = 'Kuwait';
          } else if (countryCode === 'QA') {
            matchedCurrency = 'QAR';
            countryName = 'Qatar';
          } else if (countryCode === 'OM') {
            matchedCurrency = 'OMR';
            countryName = 'Oman';
          } else if (countryCode === 'BH') {
            matchedCurrency = 'BHD';
            countryName = 'Bahrain';
          } else {
            matchedCurrency = 'USD';
            countryName = 'International';
          }

          setDetectedCountry(countryName);

          // Only apply if user has not manually overridden
          if (!localStorage.getItem('bsp_user_currency')) {
            setCurrencyState(matchedCurrency);
            setIsAutoDetected(true);
          }
        }
      } catch (err) {
        console.warn('Geolocation detection bypassed, using timezone defaults:', err);
      }
    };

    detectLocationViaApi();

    // 4. Background fetch for current live exchange rates
    const fetchLiveRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates) {
            setRates(prev => {
              const updated = { ...prev };
              for (const code of Object.keys(SUPPORTED_CURRENCIES)) {
                if (data.rates[code] && code !== 'INR') {
                  updated[code] = data.rates[code];
                }
              }
              return updated;
            });
          }
        }
      } catch (err) {
        console.warn('Live rates fetch bypassed, using built-in rate tables:', err);
      }
    };

    fetchLiveRates();
  }, []);

  const setCurrency = (currencyCode: string) => {
    if (SUPPORTED_CURRENCIES[currencyCode]) {
      setCurrencyState(currencyCode);
      setIsAutoDetected(false);
      localStorage.setItem('bsp_user_currency', currencyCode);
    }
  };

  /**
   * Converts any INR price into Base USD according to prompt requirements:
   * - ₹3,000/- -> $70 Base USD (MRP $140)
   * - ₹5,000/- -> $99 Base USD (MRP $199)
   * - ₹1,000/- (Mobile Repair) -> $25 Base USD (MRP $70)
   * - ₹6,000/- -> $120 Base USD (or $140 if isOriginal)
   * - ₹999/- -> $25 Base USD
   * - ₹2,999/- -> $70 Base USD
   * - ₹4,999/- -> $99 Base USD
   */
  const convertInrToBaseUSD = (rawNumeric: number, isOriginal: boolean = false): number => {
    if (rawNumeric === 3000) {
      return isOriginal ? 140 : 70;
    }
    if (rawNumeric === 5000) {
      return isOriginal ? 199 : 99;
    }
    if (rawNumeric === 6000) {
      return isOriginal ? 140 : 120;
    }
    if (rawNumeric === 1000) {
      return isOriginal ? 70 : 25;
    }
    if (rawNumeric === 999) {
      return isOriginal ? 50 : 25;
    }
    if (rawNumeric === 2499) {
      return isOriginal ? 120 : 60;
    }
    if (rawNumeric === 2999) {
      return isOriginal ? 140 : 70;
    }
    if (rawNumeric === 4999) {
      return isOriginal ? 199 : 99;
    }
    if (rawNumeric === 10000) {
      return isOriginal ? 240 : 200;
    }

    // Dynamic proportionality based on ₹3000 = $70 (~42.85 INR per USD)
    const proportionalUSD = Math.round(rawNumeric / 42.85);
    return Math.max(1, proportionalUSD);
  };

  /**
   * Extracts raw number from string or number
   */
  const parseRawInr = (inrValue: number | string | undefined | null): number => {
    if (inrValue === undefined || inrValue === null) return 3000;
    if (typeof inrValue === 'number') return inrValue;
    const cleanStr = String(inrValue).replace(/[^0-9]/g, '');
    const num = parseInt(cleanStr, 10);
    return isNaN(num) ? 3000 : num;
  };

  /**
   * Returns the numerical value in active currency
   */
  const getNumericPrice = (inrValue: number | string | undefined | null, isOriginal: boolean = false): number => {
    const rawInr = parseRawInr(inrValue);

    // India: Exact same price as currently fixed
    if (currency === 'INR') {
      return rawInr;
    }

    // Base USD Price
    const baseUSD = convertInrToBaseUSD(rawInr, isOriginal);
    if (currency === 'USD') {
      return baseUSD;
    }

    // Convert from USD to target currency using exchange rates
    const rate = rates[currency] || SUPPORTED_CURRENCIES[currency]?.rateVsUSD || 1.0;
    const converted = baseUSD * rate;

    // Smart rounding for clean UI prices
    if (rate >= 100) {
      return Math.round(converted / 10) * 10;
    }
    return Math.round(converted);
  };

  /**
   * Formats price string with proper symbol, code, and currency conventions
   */
  const formatPrice = (inrValue: number | string | undefined | null, isOriginal: boolean = false): string => {
    const rawInr = parseRawInr(inrValue);

    // 1. India: Keep exact original INR formatting
    if (currency === 'INR') {
      return `₹${rawInr.toLocaleString('en-IN')}`;
    }

    const cur = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;
    const numericAmount = getNumericPrice(inrValue, isOriginal);

    return `${cur.symbol}${numericAmount.toLocaleString()}`;
  };

  /**
   * Formats a raw amount in current currency
   */
  const formatAmount = (amount: number): string => {
    const cur = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR;
    return `${cur.symbol}${amount.toLocaleString()}`;
  };

  const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR;

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyInfo,
        detectedCountry,
        detectedCountryCode,
        isAutoDetected,
        setCurrency,
        formatPrice,
        getNumericPrice,
        formatAmount
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
