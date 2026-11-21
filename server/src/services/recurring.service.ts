import mongoose from 'mongoose';
import { RecurringTransaction, IRecurringTransaction } from '../models/RecurringTransaction';
import { Transaction } from '../models/Transaction';
import { summaryCache } from '../utils/cache';

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
  startDate?: string | Date;
  nextDueDate?: string | Date;
  autoProcess?: boolean;
  notes?: string;
}

export class RecurringService {
  /**
   * Helper to advance date by recurring frequency
   */
  calculateNextDueDate(baseDate: Date, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date {
    const next = new Date(baseDate);
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }

  /**
   * Get all recurring transactions for a user
   */
  async getUserRecurring(userId: string): Promise<IRecurringTransaction[]> {
    return RecurringTransaction.find({ userId }).sort({ nextDueDate: 1 });
  }

  /**
   * Create a recurring transaction rule
   */
  async createRecurring(userId: string, data: CreateRecurringDTO): Promise<IRecurringTransaction> {
    const start = data.startDate ? new Date(data.startDate) : new Date();
    const nextDue = data.nextDueDate ? new Date(data.nextDueDate) : start;

    const recurring = await RecurringTransaction.create({
      userId,
      title: data.title,
      amount: data.amount,
      type: data.type,
      category: data.category,
      paymentMethod: data.paymentMethod || 'UPI',
      frequency: data.frequency || 'monthly',
      startDate: start,
      nextDueDate: nextDue,
      autoProcess: data.autoProcess !== undefined ? data.autoProcess : true,
      notes: data.notes,
      status: 'active',
    });

    return recurring;
  }

  /**
   * Update a recurring transaction rule
   */
  async updateRecurring(
    userId: string,
    id: string,
    data: Partial<CreateRecurringDTO>
  ): Promise<IRecurringTransaction | null> {
    const recurring = await RecurringTransaction.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    return recurring;
  }

  /**
   * Update status (active | paused | cancelled)
   */
  async updateStatus(
    userId: string,
    id: string,
    status: 'active' | 'paused' | 'cancelled'
  ): Promise<IRecurringTransaction | null> {
    const recurring = await RecurringTransaction.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status } },
      { new: true }
    );
    return recurring;
  }

  /**
   * Delete a recurring transaction rule
   */
  async deleteRecurring(userId: string, id: string): Promise<boolean> {
    const result = await RecurringTransaction.findOneAndDelete({ _id: id, userId });
    return !!result;
  }

  /**
   * Process all due recurring transactions for a user (or specific rule)
   */
  async processDue(userId: string, ruleId?: string) {
    const now = new Date();
    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
      status: 'active',
      nextDueDate: { $lte: now },
    };

    if (ruleId) {
      query._id = new mongoose.Types.ObjectId(ruleId);
    }

    const dueItems = await RecurringTransaction.find(query);
    const processed: any[] = [];

    for (const item of dueItems) {
      // 1. Create the actual transaction record
      const transaction = await Transaction.create({
        userId: item.userId,
        amount: item.amount,
        type: item.type,
        category: item.category,
        paymentMethod: item.paymentMethod,
        notes: `[Recurring] ${item.title}${item.notes ? ` - ${item.notes}` : ''}`,
        date: item.nextDueDate || now,
      });

      // 2. Advance nextDueDate
      item.lastProcessedDate = now;
      item.nextDueDate = this.calculateNextDueDate(item.nextDueDate, item.frequency);
      await item.save();

      processed.push({
        recurringId: item._id,
        title: item.title,
        transactionId: transaction._id,
        amount: item.amount,
        type: item.type,
        nextDueDate: item.nextDueDate,
      });
    }

    if (processed.length > 0) {
      summaryCache.delete(`summary_${userId}`);
    }

    return {
      processedCount: processed.length,
      items: processed,
    };
  }
}

export const recurringService = new RecurringService();

