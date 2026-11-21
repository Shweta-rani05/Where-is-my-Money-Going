import React, { createContext, useContext, useState, useEffect } from 'react';
import { currencyService, type CurrencyInfo } from '../services/currency.service';

interface CurrencyContextType {
  currentCurrency: string;
  currencies: CurrencyInfo[];
  currencyInfo: CurrencyInfo;
  setCurrency: (code: string) => void;
  formatAmount: (amountInINR: number, showDecimals?: boolean) => string;
  convertFromINR: (amountInINR: number) => number;
}

const DEFAULT_INR: CurrencyInfo = {
  code: 'INR',
  name: 'Indian Rupee',
  symbol: '₹',
  rateAgainstINR: 1.0,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentCurrency, setCurrentCurrencyState] = useState<string>(() => {
    return localStorage.getItem('preferred_currency') || 'INR';
  });

  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([DEFAULT_INR]);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const list = await currencyService.getCurrencies();
        if (list && list.length > 0) {
          setCurrencies(list);
        }
      } catch (err) {
        // Fallback to local defaults
      }
    };
    fetchCurrencies();
  }, []);

  const setCurrency = (code: string) => {
    const upper = code.toUpperCase();
    setCurrentCurrencyState(upper);
    localStorage.setItem('preferred_currency', upper);
    currencyService.updatePreference(upper).catch(() => {});
  };

  const currencyInfo =
    currencies.find((c) => c.code === currentCurrency) || DEFAULT_INR;

  const convertFromINR = (amountInINR: number): number => {
    return amountInINR * currencyInfo.rateAgainstINR;
  };

  const formatAmount = (amountInINR: number, showDecimals = true): string => {
    const converted = convertFromINR(amountInINR);
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    });
    return `${currencyInfo.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        currencies,
        currencyInfo,
        setCurrency,
        formatAmount,
        convertFromINR,
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

export default CurrencyContext;

