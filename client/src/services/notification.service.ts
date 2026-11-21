import api from './api';

export type NotificationType =
  | 'budget_alert'
  | 'bill_due'
  | 'goal_milestone'
  | 'spending_anomaly'
  | 'system';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export const notificationService = {
  async getNotifications(): Promise<NotificationResponse> {
    const response = await api.get('/notifications');
    return response.data.data;
  },

  async markAsRead(id: string): Promise<NotificationItem> {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data.notification;
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};

export default notificationService;

