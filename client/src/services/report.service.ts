import api from './api';

export interface SendReportParams {
  month?: number;
  year?: number;
}

export interface ReportCategorySummary {
  category: string;
  amount: number;
  percentage: number;
  budgetLimit?: number;
  isOverBudget?: boolean;
}

export interface ReportExpenseItem {
  notes?: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
}

export interface MonthlyReportData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  period: {
    month: number;
    monthName: string;
    year: number;
  };
  metrics: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    savingsRate: number;
    transactionCount: number;
  };
  categoryBreakdown: ReportCategorySummary[];
  topExpenses: ReportExpenseItem[];
  keyTakeaway: string;
}

export interface SendReportResponse {
  status: 'success' | 'fail';
  message: string;
  data: {
    success: boolean;
    simulated: boolean;
    id?: string;
    recipient: string;
    subject: string;
    reportData: MonthlyReportData;
  };
}

export const reportService = {
  /**
   * Request server to compile and send monthly expense report to user's registered email via Resend
   */
  async sendEmailReport(params?: SendReportParams): Promise<SendReportResponse> {
    const response = await api.post<SendReportResponse>('/reports/send-email', params || {});
    return response.data;
  },

  /**
   * Fetch preview data and HTML markup of the report
   */
  async getReportPreview(params?: SendReportParams): Promise<{ status: string; data: { reportData: MonthlyReportData; html: string } }> {
    const response = await api.get('/reports/preview', { params });
    return response.data;
  },
};

export default reportService;

