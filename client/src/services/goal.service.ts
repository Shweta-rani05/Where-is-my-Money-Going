import api from './api';

export interface Goal {
  _id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export const goalService = {
  getGoals: async (): Promise<Goal[]> => {
    const response = await api.get<ApiResponse<{ goals: Goal[] }>>('/goals');
    return response.data.data.goals;
  },

  createGoal: async (data: { title: string; targetAmount: number }): Promise<Goal> => {
    const response = await api.post<ApiResponse<{ goal: Goal }>>('/goals', data);
    return response.data.data.goal;
  },

  updateGoal: async (id: string, data: Partial<{ title: string; targetAmount: number; savedAmount: number }>): Promise<Goal> => {
    const response = await api.put<ApiResponse<{ goal: Goal }>>(`/goals/${id}`, data);
    return response.data.data.goal;
  },

  deleteGoal: async (id: string): Promise<void> => {
    await api.delete(`/goals/${id}`);
  }
};

export default goalService;
