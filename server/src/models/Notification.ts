import { Schema, model, Document } from 'mongoose';

export type NotificationType =
  | 'budget_alert'
  | 'bill_due'
  | 'goal_milestone'
  | 'spending_anomaly'
  | 'system';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export interface INotification extends Document {
  userId: Schema.Types.ObjectId | string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
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
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: ['budget_alert', 'bill_due', 'goal_milestone', 'spending_anomaly', 'system'],
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-expire notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Notification = model<INotification>('Notification', NotificationSchema);

