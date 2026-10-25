import React, { useState, useRef, useEffect } from 'react';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';
import { Globe, Check, ChevronDown, Sparkles } from 'lucide-react';

interface CurrencySelectorProps {
  compact?: boolean;
  className?: string;
}

export default function CurrencySelector({ compact = false, className = '' }: CurrencySelectorProps) {
  const { currency, currencyInfo, detectedCountry, isAutoDetected, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currencyList = Object.values(SUPPORTED_CURRENCIES);
  const filteredCurrencies = currencyList.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.symbol.includes(searchTerm)
  );

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef} id="currency-selector-container">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1E293B]/90 hover:bg-[#1E293B] text-slate-200 border border-slate-700/80 hover:border-blue-500/60 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer shadow-sm group select-none active:scale-97"
        id="currency-selector-button"
        title={`Current Currency: ${currencyInfo.name} (${currencyInfo.code})`}
      >
        <span className="text-sm select-none leading-none">{currencyInfo.flag}</span>
        <span className="font-mono text-white text-[11px] font-bold">{currencyInfo.code}</span>
        <span className="text-[10px] text-blue-400 font-bold font-mono">({currencyInfo.symbol.trim()})</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-blue-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in text-left font-sans backdrop-blur-md"
          id="currency-dropdown-menu"
        >
          {/* Header & Location info */}
          <div className="px-3.5 py-2 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-400" />
                Select Currency
              </span>
              {isAutoDetected && (
                <span className="text-[9.5px] px-2 py-0.5 bg-blue-950/80 border border-blue-800/60 text-blue-300 rounded-full font-mono flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-blue-400" /> Auto-detected
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Detected Location: <strong className="text-white">{detectedCountry}</strong>
            </p>
          </div>

          {/* Search box if more than 6 currencies */}
          <div className="p-2 border-b border-slate-800">
            <input
              type="text"
              placeholder="Search currency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500 font-sans"
              autoFocus
            />
          </div>

          {/* Currencies list */}
          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-850/50">
            {filteredCurrencies.map((c) => {
              const isSelected = c.code === currency;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCurrency(c.code);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-3.5 py-2 flex items-center justify-between text-xs hover:bg-slate-800/80 transition-colors text-left cursor-pointer ${
                    isSelected ? 'bg-blue-900/30 text-blue-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base select-none leading-none">{c.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="font-mono font-bold text-white text-xs">{c.code}</span>
                        <span className="text-blue-400 font-mono text-[11px]">({c.symbol.trim()})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal leading-tight block mt-0.5">
                        {c.name}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                </button>
              );
            })}
            {filteredCurrencies.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500 font-sans">
                No matching currencies found.
              </div>
            )}
          </div>

          {/* Footer notice */}
          <div className="px-3.5 py-2 border-t border-slate-800 text-[10px] text-slate-400 text-center font-mono">
            {currency === 'INR' ? (
              <span>🇮🇳 Fixed India Regional Price</span>
            ) : (
              <span>Base USD ($70 / $99) converted via live FX rates</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
