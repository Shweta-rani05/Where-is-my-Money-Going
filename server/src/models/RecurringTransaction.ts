import { Schema, model, Document } from 'mongoose';

export interface IRecurringTransaction extends Document {
  userId: Schema.Types.ObjectId | string;
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
  startDate: Date;
  nextDueDate: Date;
  lastProcessedDate?: Date;
  status: 'active' | 'paused' | 'cancelled';
  autoProcess: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringTransactionSchema = new Schema<IRecurringTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User association is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: ['income', 'expense'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Food',
        'Rent',
        'Shopping',
        'Transport',
        'Bills',
        'Healthcare',
        'Entertainment',
        'Investment',
        'Salary',
        'Others',
      ],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['Cash', 'Credit Card', 'Bank Transfer', 'UPI', 'Others'],
      default: 'UPI',
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    nextDueDate: {
      type: Date,
      required: [true, 'Next due date is required'],
      index: true,
    },
    lastProcessedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled'],
      default: 'active',
      index: true,
    },
    autoProcess: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const RecurringTransaction = model<IRecurringTransaction>(
  'RecurringTransaction',
  RecurringTransactionSchema
);

