import api from './api';

export interface Transaction {
  _id: string;
  amount: number;
  type: 'income' | 'expense';
  category: 'Food' | 'Rent' | 'Shopping' | 'Transport' | 'Bills' | 'Healthcare' | 'Entertainment' | 'Investment' | 'Salary' | 'Others';
  paymentMethod: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'UPI' | 'Others';
  notes?: string;
  date: string;
  createdAt: string;
}

export interface PaginationMetadata {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface GetTransactionsPayload {
  transactions: Transaction[];
  pagination: PaginationMetadata;
}

export interface TransactionSummary {
  totals: {
    income: number;
    expenses: number;
    savings: number;
    remainingBudget: number;
    hasBudget: boolean;
    budgetLimit: number;
  };
  cashFlowTrend: { name: string; Income: number; Expenses: number }[];
  categoryDistribution: { name: string; value: number }[];
}

export interface TransactionFilters {
  search?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Transaction Service client.
 * Calls backend API controllers for transactions CRUD.
 */
export const transactionService = {
  /**
   * Fetch summarized stats and chart data.
   */
  getTransactionSummary: async (): Promise<TransactionSummary> => {
    const response = await api.get<ApiResponse<TransactionSummary>>('/transactions/summary');
    return response.data.data;
  },

  /**
   * Fetch user transactions with filters, search, and pagination rules.
   */
  getTransactions: async (filters: TransactionFilters = {}): Promise<GetTransactionsPayload> => {
    const response = await api.get<ApiResponse<GetTransactionsPayload>>('/transactions', {
      params: filters
    });
    return response.data.data;
  },


  /**
   * Create a new transaction.
   */
  createTransaction: async (data: Omit<Transaction, '_id' | 'createdAt'>): Promise<Transaction> => {
    const response = await api.post<ApiResponse<{ transaction: Transaction }>>('/transactions', data);
    return response.data.data.transaction;
  },

  /**
   * Update an existing transaction by ID.
   */
  updateTransaction: async (id: string, data: Partial<Omit<Transaction, '_id' | 'createdAt'>>): Promise<Transaction> => {
    const response = await api.put<ApiResponse<{ transaction: Transaction }>>(`/transactions/${id}`, data);
    return response.data.data.transaction;
  },

  /**
   * Delete a transaction by ID.
   */
  deleteTransaction: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  }
};

export default transactionService;
