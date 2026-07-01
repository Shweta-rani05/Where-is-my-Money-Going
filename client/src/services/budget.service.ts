import api from './api';

export interface Budget {
  _id: string;
  category: 'Food' | 'Rent' | 'Shopping' | 'Transport' | 'Bills' | 'Healthcare' | 'Entertainment' | 'Others';
  limit: number;
  spent: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

/**
 * Budget Service client.
 * Calls backend API controllers for budgets CRUD.
 */
export const budgetService = {
  /**
   * Fetch all category budgets merged with active spent sums.
   */
  getBudgets: async (): Promise<Budget[]> => {
    const response = await api.get<ApiResponse<{ budgets: Budget[] }>>('/budgets');
    return response.data.data.budgets;
  },

  /**
   * Create or update a budget limit upsert.
   */
  updateBudget: async (data: { category: string; limit: number }): Promise<Budget> => {
    const response = await api.post<ApiResponse<{ budget: Budget }>>('/budgets', data);
    return response.data.data.budget;
  },

  /**
   * Remove a category budget.
   */
  deleteBudget: async (id: string): Promise<void> => {
    await api.delete(`/budgets/${id}`);
  }
};

export default budgetService;
