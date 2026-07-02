import mongoose, { Schema, Document } from 'mongoose';

export interface IAIHistory extends Document {
  userId: mongoose.Types.ObjectId;
  prompt: string;
  response: string;
  createdAt: Date;
}

const AIHistorySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    prompt: {
      type: String,
      required: true
    },
    response: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const AIHistory = mongoose.model<IAIHistory>('AIHistory', AIHistorySchema);
