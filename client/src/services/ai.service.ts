import api from './api';

interface ChatResponse {
  status: string;
  data: {
    response: string;
    mode: 'gemini' | 'rule-based';
  };
  message?: string;
}

export interface AIHistoryItem {
  _id: string;
  userId: string;
  prompt: string;
  response: string;
  createdAt: string;
}

export interface HistoryResponse {
  status: string;
  data: AIHistoryItem[];
}

export interface AIInsights {
  analyzeSpending: string[];
  budgetSuggestions: string[];
  expenseTrends: string[];
  savingsTips: string[];
}

export interface InsightsResponse {
  status: string;
  data: AIInsights;
}

export const aiService = {
  sendMessage: async (message: string): Promise<{ response: string; mode: 'gemini' | 'rule-based' }> => {
    const response = await api.post<ChatResponse>('/ai/chat', { message });
    return response.data.data;
  },
  getHistory: async (): Promise<AIHistoryItem[]> => {
    const response = await api.get<HistoryResponse>('/ai/history');
    return response.data.data;
  },
  getInsights: async (): Promise<AIInsights> => {
    const response = await api.get<InsightsResponse>('/ai/insights');
    return response.data.data;
  }
};

export default aiService;
