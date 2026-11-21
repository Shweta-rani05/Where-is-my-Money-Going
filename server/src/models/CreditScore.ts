import { Schema, model, Document } from 'mongoose';

export interface ICreditFactor {
  score: number; // 0 - 100
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  detail: string;
}

export interface ICreditScore extends Document {
  userId: Schema.Types.ObjectId | string;
  score: number; // 300 - 900
  tier: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor';
  factors: {
    paymentHistory: ICreditFactor;
    creditUtilization: ICreditFactor;
    creditAge: ICreditFactor;
    debtToIncome: ICreditFactor;
    creditMix: ICreditFactor;
  };
  scoreHistory: Array<{
    date: Date;
    score: number;
  }>;
  recommendations: string[];
  lastCalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CreditFactorSchema = new Schema(
  {
    score: { type: Number, required: true },
    rating: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      required: true,
    },
    detail: { type: String, required: true },
  },
  { _id: false }
);

const CreditScoreSchema = new Schema<ICreditScore>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 300,
      max: 900,
      default: 750,
    },
    tier: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'],
      default: 'Good',
    },
    factors: {
      paymentHistory: { type: CreditFactorSchema, required: true },
      creditUtilization: { type: CreditFactorSchema, required: true },
      creditAge: { type: CreditFactorSchema, required: true },
      debtToIncome: { type: CreditFactorSchema, required: true },
      creditMix: { type: CreditFactorSchema, required: true },
    },
    scoreHistory: [
      {
        date: { type: Date, default: Date.now },
        score: { type: Number, required: true },
      },
    ],
    recommendations: [{ type: String }],
    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const CreditScore = model<ICreditScore>('CreditScore', CreditScoreSchema);

