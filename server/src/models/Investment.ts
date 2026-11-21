import { Schema, model, Document } from 'mongoose';

export type AssetClass =
  | 'stocks'
  | 'mutual_funds'
  | 'crypto'
  | 'gold'
  | 'fixed_deposit'
  | 'real_estate'
  | 'other';

export interface IInvestment extends Document {
  userId: Schema.Types.ObjectId | string;
  name: string;
  symbol?: string;
  assetClass: AssetClass;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  currency: string;
  purchaseDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User association is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    symbol: {
      type: String,
      trim: true,
      uppercase: true,
    },
    assetClass: {
      type: String,
      required: [true, 'Asset class is required'],
      enum: {
        values: [
          'stocks',
          'mutual_funds',
          'crypto',
          'gold',
          'fixed_deposit',
          'real_estate',
          'other',
        ],
        message: '{VALUE} is not a valid asset class',
      },
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.000001, 'Quantity must be positive'],
    },
    buyPrice: {
      type: Number,
      required: [true, 'Purchase price per unit is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    currentPrice: {
      type: Number,
      required: [true, 'Current price per unit is required'],
      min: [0, 'Current price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
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

export const Investment = model<IInvestment>('Investment', InvestmentSchema);

