export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rateAgainstINR: number; // 1 INR in this currency
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    rateAgainstINR: 1.0,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    rateAgainstINR: 0.0116, // ~$1 = ₹86.20
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    rateAgainstINR: 0.011, // ~€1 = ₹90.90
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    rateAgainstINR: 0.0094, // ~£1 = ₹106.38
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    rateAgainstINR: 0.0425, // ~1 AED = ₹23.50
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    rateAgainstINR: 1.78, // ~1 JPY = ₹0.56
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    rateAgainstINR: 0.0163,
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    rateAgainstINR: 0.0182,
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    rateAgainstINR: 0.0157,
  },
};

export class CurrencyService {
  /**
   * Return catalog of supported currencies
   */
  getSupportedCurrencies() {
    return Object.values(SUPPORTED_CURRENCIES);
  }

  /**
   * Return exchange rates map
   */
  getExchangeRates() {
    return {
      base: 'INR',
      timestamp: new Date().toISOString(),
      rates: SUPPORTED_CURRENCIES,
    };
  }

  /**
   * Convert an amount between two currencies
   */
  convert(amount: number, from = 'INR', to = 'USD') {
    const fromInfo = SUPPORTED_CURRENCIES[from.toUpperCase()] || SUPPORTED_CURRENCIES.INR;
    const toInfo = SUPPORTED_CURRENCIES[to.toUpperCase()] || SUPPORTED_CURRENCIES.USD;

    // Convert from -> INR, then INR -> to
    const inINR = amount / fromInfo.rateAgainstINR;
    const converted = inINR * toInfo.rateAgainstINR;
    const effectiveRate = toInfo.rateAgainstINR / fromInfo.rateAgainstINR;

    return {
      originalAmount: amount,
      from: fromInfo.code,
      convertedAmount: Math.round(converted * 100) / 100,
      to: toInfo.code,
      symbol: toInfo.symbol,
      rate: effectiveRate,
    };
  }
}

export const currencyService = new CurrencyService();

