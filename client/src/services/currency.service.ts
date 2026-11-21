import api from './api';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rateAgainstINR: number;
}

export interface ExchangeRatesData {
  base: string;
  timestamp: string;
  rates: Record<string, CurrencyInfo>;
}

export const currencyService = {
  async getCurrencies(): Promise<CurrencyInfo[]> {
    const response = await api.get('/currency');
    return response.data.data.currencies;
  },

  async getRates(): Promise<ExchangeRatesData> {
    const response = await api.get('/currency/rates');
    return response.data.data;
  },

  async convert(amount: number, from = 'INR', to = 'USD'): Promise<{
    originalAmount: number;
    from: string;
    convertedAmount: number;
    to: string;
    symbol: string;
    rate: number;
  }> {
    const response = await api.get('/currency/convert', {
      params: { amount, from, to },
    });
    return response.data.data;
  },

  async updatePreference(currency: string): Promise<void> {
    await api.patch('/currency/preference', { currency });
  },
};

export default currencyService;

