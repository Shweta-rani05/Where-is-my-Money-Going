import api from './api';

export interface RecurringTransaction {
  _id: string;
  userId: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category:
    | 'Food'
    | 'Rent'
    | 'Shopping'
    | 'Transport'
    | 'Bills'
    | 'Healthcare'
    | 'Entertainment'
    | 'Investment'
    | 'Salary'
    | 'Others';
  paymentMethod: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'UPI' | 'Others';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  nextDueDate: string;
  lastProcessedDate?: string;
  status: 'active' | 'paused' | 'cancelled';
  autoProcess: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringDTO {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category:
    | 'Food'
    | 'Rent'
    | 'Shopping'
    | 'Transport'
    | 'Bills'
    | 'Healthcare'
    | 'Entertainment'
    | 'Investment'
    | 'Salary'
    | 'Others';
  paymentMethod: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'UPI' | 'Others';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  nextDueDate?: string;
  autoProcess?: boolean;
  notes?: string;
}

export const recurringService = {
  async getRecurring(): Promise<RecurringTransaction[]> {
    const response = await api.get('/recurring');
    return response.data.data.recurring;
  },

  async createRecurring(data: CreateRecurringDTO): Promise<RecurringTransaction> {
    const response = await api.post('/recurring', data);
    return response.data.data.recurring;
  },

  async updateRecurring(id: string, data: Partial<CreateRecurringDTO>): Promise<RecurringTransaction> {
    const response = await api.put(`/recurring/${id}`, data);
    return response.data.data.recurring;
  },

  async updateStatus(id: string, status: 'active' | 'paused' | 'cancelled'): Promise<RecurringTransaction> {
    const response = await api.patch(`/recurring/${id}/status`, { status });
    return response.data.data.recurring;
  },

  async deleteRecurring(id: string): Promise<void> {
    await api.delete(`/recurring/${id}`);
  },

  async processDue(ruleId?: string): Promise<{ processedCount: number; items: any[] }> {
    const response = await api.post('/recurring/process-due', { ruleId });
    return response.data.data;
  },
};

export default recurringService;

