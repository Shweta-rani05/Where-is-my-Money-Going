import { Schema, model, Document } from 'mongoose';

export interface IGoal extends Document {
  userId: Schema.Types.ObjectId | string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User association is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [0.01, 'Target must be a positive number']
    },
    savedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Saved amount cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

export const Goal = model<IGoal>('Goal', GoalSchema);
