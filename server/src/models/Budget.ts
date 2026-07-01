import { Schema, model, Document } from 'mongoose';

export interface IBudget extends Document {
  userId: Schema.Types.ObjectId | string;
  category: 'Food' | 'Rent' | 'Shopping' | 'Transport' | 'Bills' | 'Healthcare' | 'Entertainment' | 'Others';
  limit: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User association is required'],
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Food', 'Rent', 'Shopping', 'Transport', 'Bills', 'Healthcare', 'Entertainment', 'Others'],
        message: '{VALUE} is not a valid budgeting category'
      }
    },
    limit: {
      type: Number,
      required: [true, 'Budget limit is required'],
      min: [0.01, 'Budget limit must be a positive number greater than 0']
    }
  },
  {
    timestamps: true
  }
);

// Enforce a compound unique index so a user has at most one budget per category
BudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

export const Budget = model<IBudget>('Budget', BudgetSchema);
