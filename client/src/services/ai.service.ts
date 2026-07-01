import api from './api';

interface ChatResponse {
  status: string;
  data: {
    response: string;
    mode: 'gemini' | 'rule-based';
  };
  message?: string;
}

export const aiService = {
  sendMessage: async (message: string): Promise<{ response: string; mode: 'gemini' | 'rule-based' }> => {
    const response = await api.post<ChatResponse>('/ai/chat', { message });
    return response.data.data;
  }
};

export default aiService;
