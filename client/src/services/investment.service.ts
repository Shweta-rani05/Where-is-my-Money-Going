import api from './api';

export type AssetClass =
  | 'stocks'
  | 'mutual_funds'
  | 'crypto'
  | 'gold'
  | 'fixed_deposit'
  | 'real_estate'
  | 'other';

export interface InvestmentHolding {
  _id: string;
  name: string;
  symbol?: string;
  assetClass: AssetClass;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  gainLoss: number;
  returnPercentage: number;
  currency: string;
  purchaseDate: string;
  notes?: string;
  updatedAt: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalReturnPercentage: number;
  holdingsCount: number;
}

export interface AssetAllocationItem {
  assetClass: AssetClass;
  value: number;
  percentage: number;
}

export interface PortfolioData {
  summary: PortfolioSummary;
  assetAllocation: AssetAllocationItem[];
  holdings: InvestmentHolding[];
}

export interface CreateInvestmentDTO {
  name: string;
  symbol?: string;
  assetClass: AssetClass;
  quantity: number;
  buyPrice: number;
  currentPrice?: number;
  currency?: string;
  purchaseDate?: string;
  notes?: string;
  recordAsExpense?: boolean;
}

export const investmentService = {
  async getPortfolio(): Promise<PortfolioData> {
    const response = await api.get('/investments');
    return response.data.data;
  },

  async createInvestment(data: CreateInvestmentDTO): Promise<InvestmentHolding> {
    const response = await api.post('/investments', data);
    return response.data.data.investment;
  },

  async updateInvestment(id: string, data: Partial<CreateInvestmentDTO>): Promise<InvestmentHolding> {
    const response = await api.put(`/investments/${id}`, data);
    return response.data.data.investment;
  },

  async deleteInvestment(id: string): Promise<void> {
    await api.delete(`/investments/${id}`);
  },

  async refreshPrices(): Promise<PortfolioData> {
    const response = await api.post('/investments/refresh');
    return response.data.data;
  },
};

export default investmentService;

