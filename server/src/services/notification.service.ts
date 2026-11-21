import mongoose from 'mongoose';
import { Notification, INotification, NotificationType, NotificationSeverity } from '../models/Notification';
import { Budget } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import { RecurringTransaction } from '../models/RecurringTransaction';
import { Goal } from '../models/Goal';

export class NotificationService {
  /**
   * Automatically inspect budgets, recurring bills, and goals to generate smart financial alerts
   */
  async generateSmartNotifications(userId: string) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const createdNotifications: INotification[] = [];

    // ── 1. Check Budget Thresholds (80% & 100% Breaches) ─────────────
    const budgets = await Budget.find({ userId });
    if (budgets.length > 0) {
      // Aggregate expenses by category for this month
      const categoryExpenses = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: 'expense',
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: '$category',
            spent: { $sum: '$amount' },
          },
        },
      ]);

      const spentMap = new Map<string, number>();
      categoryExpenses.forEach((c) => spentMap.set(c._id, c.spent));

      for (const b of budgets) {
        const spent = spentMap.get(b.category) || 0;
        const ratio = b.limit > 0 ? spent / b.limit : 0;
        const pct = Math.round(ratio * 100);

        if (ratio >= 1.0) {
          const title = `⚠️ Budget Exceeded: ${b.category}`;
          const exists = await Notification.findOne({
            userId,
            title,
            createdAt: { $gte: oneDayAgo },
          });

          if (!exists) {
            const notif = await Notification.create({
              userId,
              title,
              message: `You spent ₹${spent.toLocaleString('en-IN')} on ${b.category}, exceeding your monthly limit of ₹${b.limit.toLocaleString('en-IN')} (${pct}%).`,
              type: 'budget_alert',
              severity: 'error',
              link: '/budgets',
            });
            createdNotifications.push(notif);
          }
        } else if (ratio >= 0.8) {
          const title = `Budget Alert: ${b.category} at ${pct}%`;
          const exists = await Notification.findOne({
            userId,
            title,
            createdAt: { $gte: oneDayAgo },
          });

          if (!exists) {
            const notif = await Notification.create({
              userId,
              title,
              message: `You have utilized ${pct}% of your ${b.category} budget (₹${spent.toLocaleString('en-IN')} of ₹${b.limit.toLocaleString('en-IN')}).`,
              type: 'budget_alert',
              severity: 'warning',
              link: '/budgets',
            });
            createdNotifications.push(notif);
          }
        }
      }
    }

    // ── 2. Check Upcoming & Overdue Recurring Bills ───────────────────
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const recurringDue = await RecurringTransaction.find({
      userId,
      status: 'active',
      nextDueDate: { $lte: threeDaysFromNow },
    });

    for (const r of recurringDue) {
      const isOverdue = new Date(r.nextDueDate) < now;
      const title = isOverdue
        ? `Overdue Bill: ${r.title}`
        : `Upcoming Bill: ${r.title}`;

      const exists = await Notification.findOne({
        userId,
        title,
        createdAt: { $gte: oneDayAgo },
      });

      if (!exists) {
        const dateStr = new Date(r.nextDueDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        });

        const notif = await Notification.create({
          userId,
          title,
          message: isOverdue
            ? `Your recurring payment of ₹${r.amount.toLocaleString('en-IN')} for "${r.title}" was due on ${dateStr}.`
            : `Your scheduled payment of ₹${r.amount.toLocaleString('en-IN')} for "${r.title}" is due on ${dateStr}.`,
          type: 'bill_due',
          severity: isOverdue ? 'error' : 'warning',
          link: '/recurring',
        });
        createdNotifications.push(notif);
      }
    }

    // ── 3. Check Savings Goal Milestones ──────────────────────────────
    const goals = await Goal.find({ userId });
    for (const g of goals) {
      const ratio = g.targetAmount > 0 ? g.savedAmount / g.targetAmount : 0;
      if (ratio >= 1.0) {
        const title = `🎯 Goal Reached: ${g.title}`;
        const exists = await Notification.findOne({
          userId,
          title,
          createdAt: { $gte: oneDayAgo },
        });

        if (!exists) {
          const notif = await Notification.create({
            userId,
            title,
            message: `Congratulations! You reached 100% of your target amount (₹${g.targetAmount.toLocaleString('en-IN')}) for "${g.title}".`,
            type: 'goal_milestone',
            severity: 'success',
            link: '/goals',
          });
          createdNotifications.push(notif);
        }
      }
    }

    return createdNotifications;
  }

  /**
   * Fetch all notifications for a user, sorted newest first
   */
  async getUserNotifications(userId: string) {
    // Generate any fresh smart alerts first
    await this.generateSmartNotifications(userId);

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return { notifications, unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { isRead: true } },
      { new: true }
    );
    return updated;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
    return { success: true };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string) {
    const deleted = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });
    return !!deleted;
  }
}

export const notificationService = new NotificationService();
