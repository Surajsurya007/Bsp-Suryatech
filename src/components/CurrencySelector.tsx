import React from 'react';

interface CurrencySelectorProps {
  compact?: boolean;
  className?: string;
}

/**
 * CurrencySelector
 * Automatic country detection and local currency conversion operate in the background via CurrencyContext.
 * The manual selector UI button and dropdown are hidden for all users as requested.
 */
export default function CurrencySelector({ compact = false, className = '' }: CurrencySelectorProps) {
  return (
    <div 
      className={`hidden ${className}`} 
      id="currency-selector-container" 
      style={{ display: 'none' }} 
      aria-hidden="true"
    >
      <button
        type="button"
        id="currency-selector-button"
        className="hidden"
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
