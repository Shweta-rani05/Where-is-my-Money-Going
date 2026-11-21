import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const CurrencySelector: React.FC = () => {
  const { currentCurrency, currencyInfo, currencies, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border-custom hover:bg-border-custom/40 text-text-custom text-xs font-semibold transition-all cursor-pointer"
        title="Select currency"
      >
        <span className="font-bold text-primary">{currencyInfo.symbol}</span>
        <span className="hidden sm:inline">{currencyInfo.code}</span>
        <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-card-custom border border-border-custom shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-border-custom/60 text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-primary" />
            Display Currency
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-border-custom/30 py-1">
            {currencies.map((c) => {
              const isSelected = c.code === currentCurrency;
              return (
                <button
                  key={c.code}
                  onClick={() => {
                    setCurrency(c.code);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-text-custom hover:bg-background-custom'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center font-bold text-sm text-primary">
                      {c.symbol}
                    </span>
                    <div>
                      <div className="font-semibold">{c.code}</div>
                      <div className="text-[10px] text-text-muted">{c.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;

