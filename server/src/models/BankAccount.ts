import { Schema, model, Document } from 'mongoose';

export interface IBankAccount extends Document {
  userId: Schema.Types.ObjectId | string;
  institutionId: string;
  institutionName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  accountNumberLast4: string;
  balance: number;
  currency: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncedAt?: Date;
  plaidItemId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BankAccountSchema = new Schema<IBankAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User association is required'],
      index: true,
    },
    institutionId: {
      type: String,
      required: [true, 'Institution identifier is required'],
      trim: true,
    },
    institutionName: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
    },
    accountType: {
      type: String,
      required: [true, 'Account type is required'],
      enum: {
        values: ['checking', 'savings', 'credit', 'investment'],
        message: '{VALUE} is not a valid bank account type',
      },
    },
    accountNumberLast4: {
      type: String,
      required: [true, 'Last 4 digits of account number are required'],
      match: [/^\d{4}$/, 'Account number must be 4 digits'],
    },
    balance: {
      type: Number,
      required: [true, 'Balance is required'],
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'error'],
      default: 'connected',
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    plaidItemId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

BankAccountSchema.index({ userId: 1, institutionId: 1, accountNumberLast4: 1 }, { unique: true });

export const BankAccount = model<IBankAccount>('BankAccount', BankAccountSchema);

