import api from './api';

export interface CreditFactor {
  score: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  detail: string;
}

export interface CreditScoreData {
  _id: string;
  userId: string;
  score: number;
  tier: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor';
  factors: {
    paymentHistory: CreditFactor;
    creditUtilization: CreditFactor;
    creditAge: CreditFactor;
    debtToIncome: CreditFactor;
    creditMix: CreditFactor;
  };
  scoreHistory: Array<{
    date: string;
    score: number;
  }>;
  recommendations: string[];
  lastCalculatedAt: string;
}

export interface SimulationResult {
  currentScore: number;
  currentTier: string;
  simulatedScore: number;
  simulatedTier: string;
  delta: number;
  action: string;
  explanation: string;
}

export const creditScoreService = {
  async getCreditScore(): Promise<CreditScoreData> {
    const response = await api.get('/credit-score');
    return response.data.data;
  },

  async recalculateScore(): Promise<CreditScoreData> {
    const response = await api.post('/credit-score/refresh');
    return response.data.data;
  },

  async simulate(
    action: 'pay_debt' | 'miss_payment' | 'open_account' | 'increase_limit',
    value = 0
  ): Promise<SimulationResult> {
    const response = await api.post('/credit-score/simulate', { action, value });
    return response.data.data;
  },
};

export default creditScoreService;

