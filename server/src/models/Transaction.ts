import { Schema, model, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: Schema.Types.ObjectId | string;
  amount: number;
  type: 'income' | 'expense';
  category: 'Food' | 'Rent' | 'Shopping' | 'Transport' | 'Bills' | 'Healthcare' | 'Entertainment' | 'Investment' | 'Salary' | 'Others';
  paymentMethod: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'UPI' | 'Others';
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User association is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be a positive number greater than 0'],
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be either income or expense',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
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
        message: '{VALUE} is not a valid financial category',
      },
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['Cash', 'Credit Card', 'Bank Transfer', 'UPI', 'Others'],
        message: '{VALUE} is not a valid payment method',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = model<ITransaction>('Transaction', TransactionSchema);
