import api from './api';

export interface SupportedInstitution {
  id: string;
  name: string;
  color: string;
  country: string;
  supportedTypes: Array<'checking' | 'savings' | 'credit' | 'investment'>;
}

export interface BankAccount {
  _id: string;
  userId: string;
  institutionId: string;
  institutionName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  accountNumberLast4: string;
  balance: number;
  currency: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectAccountParams {
  institutionId: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  initialBalance?: number;
  accountNumberLast4?: string;
}

export interface SyncResult {
  accountId: string;
  institutionName: string;
  importedCount: number;
  duplicateCount: number;
  lastSyncedAt: string;
}

export const bankService = {
  /**
   * Fetch catalog of supported banks
   */
  async getInstitutions(): Promise<SupportedInstitution[]> {
    const response = await api.get('/banks/institutions');
    return response.data.data.institutions;
  },

  /**
   * Fetch user's connected bank accounts
   */
  async getUserAccounts(): Promise<BankAccount[]> {
    const response = await api.get('/banks/accounts');
    return response.data.data.accounts;
  },

  /**
   * Connect a new bank account
   */
  async connectAccount(data: ConnectAccountParams): Promise<{ account: BankAccount; initialSyncResult: SyncResult }> {
    const response = await api.post('/banks/connect', data);
    return response.data.data;
  },

  /**
   * Sync transactions from bank
   */
  async syncAccount(accountId: string): Promise<SyncResult> {
    const response = await api.post(`/banks/accounts/${accountId}/sync`);
    return response.data.data;
  },

  /**
   * Disconnect and remove account
   */
  async disconnectAccount(accountId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/banks/accounts/${accountId}`);
    return response.data;
  },
};

export default bankService;

