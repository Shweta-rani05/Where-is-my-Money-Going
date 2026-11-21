import mongoose from 'mongoose';
import { BankAccount, IBankAccount } from '../models/BankAccount';
import { Transaction } from '../models/Transaction';
import { duplicateService } from './duplicate.service';
import { summaryCache } from '../utils/cache';

export interface SupportedInstitution {
  id: string;
  name: string;
  color: string;
  country: string;
  supportedTypes: Array<'checking' | 'savings' | 'credit' | 'investment'>;
}

export const SUPPORTED_INSTITUTIONS: SupportedInstitution[] = [
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    color: '#004C8F',
    country: 'IN',
    supportedTypes: ['savings', 'checking', 'credit'],
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    color: '#280071',
    country: 'IN',
    supportedTypes: ['savings', 'checking'],
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    color: '#F58220',
    country: 'IN',
    supportedTypes: ['savings', 'checking', 'credit'],
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    color: '#97144D',
    country: 'IN',
    supportedTypes: ['savings', 'checking', 'credit'],
  },
  {
    id: 'chase',
    name: 'Chase Bank',
    color: '#117ACA',
    country: 'US',
    supportedTypes: ['checking', 'savings', 'credit'],
  },
  {
    id: 'bofa',
    name: 'Bank of America',
    color: '#E31837',
    country: 'US',
    supportedTypes: ['checking', 'savings', 'credit'],
  },
];

export class BankService {
  /**
   * Return catalog of supported financial institutions
   */
  getSupportedInstitutions(): SupportedInstitution[] {
    return SUPPORTED_INSTITUTIONS;
  }

  /**
   * Fetch user's connected bank accounts
   */
  async getUserAccounts(userId: string): Promise<IBankAccount[]> {
    return BankAccount.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Link a new bank account for the user
   */
  async connectAccount(
    userId: string,
    data: {
      institutionId: string;
      accountType: 'checking' | 'savings' | 'credit' | 'investment';
      initialBalance?: number;
      accountNumberLast4?: string;
    }
  ): Promise<{ account: IBankAccount; initialSyncResult: any }> {
    const institution = SUPPORTED_INSTITUTIONS.find((i) => i.id === data.institutionId);
    if (!institution) {
      throw new Error('Unsupported bank institution');
    }

    const last4 = data.accountNumberLast4 || Math.floor(1000 + Math.random() * 9000).toString();
    const balance = data.initialBalance !== undefined ? data.initialBalance : 25000;

    // Check if duplicate account is already connected
    const existing = await BankAccount.findOne({
      userId,
      institutionId: data.institutionId,
      accountNumberLast4: last4,
    });

    if (existing) {
      throw new Error(`Account ending with ${last4} at ${institution.name} is already linked.`);
    }

    const account = await BankAccount.create({
      userId,
      institutionId: institution.id,
      institutionName: institution.name,
      accountType: data.accountType,
      accountNumberLast4: last4,
      balance,
      currency: institution.country === 'IN' ? 'INR' : 'USD',
      status: 'connected',
      lastSyncedAt: new Date(),
    });

    // Run initial sync to fetch real/seed transactions
    const initialSyncResult = await this.syncAccount(userId, account._id.toString());

    return { account, initialSyncResult };
  }

  /**
   * Generate mock/live bank feed transactions for syncing
   */
  private generateMockBankFeed(institutionName: string, accountType: string) {
    const today = new Date();
    
    // Create timestamps within the past 14 days
    const daysAgo = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - days);
      return d;
    };

    return [
      {
        amount: 45000,
        type: 'income' as const,
        category: 'Salary' as const,
        paymentMethod: 'Bank Transfer' as const,
        notes: `Monthly Salary Direct Deposit (${institutionName})`,
        date: daysAgo(2),
      },
      {
        amount: 850,
        type: 'expense' as const,
        category: 'Food' as const,
        paymentMethod: 'UPI' as const,
        notes: 'Swiggy Online Food Order',
        date: daysAgo(1),
      },
      {
        amount: 1499,
        type: 'expense' as const,
        category: 'Shopping' as const,
        paymentMethod: accountType === 'credit' ? 'Credit Card' as const : 'UPI' as const,
        notes: 'Amazon Marketplace Purchase',
        date: daysAgo(3),
      },
      {
        amount: 650,
        type: 'expense' as const,
        category: 'Transport' as const,
        paymentMethod: 'UPI' as const,
        notes: 'Uber Ride City Transit',
        date: daysAgo(5),
      },
      {
        amount: 2100,
        type: 'expense' as const,
        category: 'Bills' as const,
        paymentMethod: 'Bank Transfer' as const,
        notes: 'Electricity & Broadband Bill Payment',
        date: daysAgo(8),
      },
    ];
  }

  /**
   * Sync transactions from the bank into the user's transaction ledger
   */
  async syncAccount(userId: string, accountId: string) {
    const account = await BankAccount.findOne({ _id: accountId, userId });
    if (!account) {
      throw new Error('Bank account not found');
    }

    // 1. Fetch transactions from bank feed
    const rawBankTransactions = this.generateMockBankFeed(
      account.institutionName,
      account.accountType
    );

    // 2. Format for duplicate filtering
    const candidates = rawBankTransactions.map((t) => ({
      amount: t.amount,
      type: t.type,
      category: t.category,
      paymentMethod: t.paymentMethod,
      notes: t.notes,
      date: t.date.toISOString(),
    }));

    // 3. Deduplicate
    const newTransactions = await duplicateService.filterNewTransactions(userId, candidates);
    const duplicateCount = candidates.length - newTransactions.length;

    // 4. Insert new transactions
    if (newTransactions.length > 0) {
      const recordsToInsert = newTransactions.map((item) => ({
        userId: new mongoose.Types.ObjectId(userId),
        amount: item.amount,
        type: item.type,
        category: item.category,
        paymentMethod: item.paymentMethod,
        notes: item.notes,
        date: new Date(item.date),
      }));

      await Transaction.insertMany(recordsToInsert);

      // Invalidate dashboard cache
      summaryCache.delete(`summary_${userId}`);
    }

    // 5. Update bank account last synced timestamp
    account.lastSyncedAt = new Date();
    account.status = 'connected';
    await account.save();

    return {
      accountId: account._id,
      institutionName: account.institutionName,
      importedCount: newTransactions.length,
      duplicateCount,
      lastSyncedAt: account.lastSyncedAt,
    };
  }

  /**
   * Disconnect and remove a bank account
   */
  async disconnectAccount(userId: string, accountId: string) {
    const account = await BankAccount.findOneAndDelete({ _id: accountId, userId });
    if (!account) {
      throw new Error('Bank account not found or unauthorized');
    }
    return { success: true, message: `Disconnected ${account.institutionName}` };
  }
}

export const bankService = new BankService();

