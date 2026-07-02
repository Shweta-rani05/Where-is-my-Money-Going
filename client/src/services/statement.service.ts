import api from './api';

export interface ParsedTransaction {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  notes: string;
  date: string;
}

export interface StatementUploadResponse {
  status: string;
  message: string;
  data: {
    imported: number;
    duplicates: number;
    parsedTransactions: ParsedTransaction[];
  };
}

export const statementService = {
  /**
   * Upload a bank statement file (PDF, JPG, PNG) to be parsed and saved.
   */
  uploadStatement: async (file: File): Promise<StatementUploadResponse> => {
    const formData = new FormData();
    formData.append('statement', file);

    const response = await api.post<StatementUploadResponse>('/statements/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }
};
