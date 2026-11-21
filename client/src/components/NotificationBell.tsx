import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  Clock,
  Trophy,
  Zap,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  notificationService,
  type NotificationItem,
  type NotificationType,
  type NotificationSeverity,
} from '../services/notification.service';
import toast from 'react-hot-toast';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      // fail silently so header never crashes
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for fresh notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      const target = notifications.find((n) => n._id === id);
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleClickItem = (item: NotificationItem) => {
    if (!item.isRead) {
      notificationService.markAsRead(item._id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (item.link) {
      setIsOpen(false);
      navigate(item.link);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getIcon = (type: NotificationType, severity: NotificationSeverity) => {
    switch (type) {
      case 'budget_alert':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'bill_due':
        return <Clock className="w-4 h-4 text-rose-500" />;
      case 'goal_milestone':
        return <Trophy className="w-4 h-4 text-emerald-500" />;
      case 'spending_anomaly':
        return <Zap className="w-4 h-4 text-purple-500" />;
      default:
        return severity === 'error' ? (
          <AlertTriangle className="w-4 h-4 text-rose-500" />
        ) : (
          <Info className="w-4 h-4 text-primary" />
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-border-custom hover:bg-border-custom/40 text-text-muted hover:text-text-custom transition-all cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in-50 shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card-custom border border-border-custom shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-border-custom flex items-center justify-between bg-background-custom/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-text-custom">Financial Alerts</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border-custom/50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/70 mb-2" />
                <p className="text-xs font-semibold text-text-custom">All clear!</p>
                <p className="text-[11px] mt-0.5">No new financial warnings or bills due.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleClickItem(item)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-background-custom/70 ${
                    !item.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  {/* Icon badge */}
                  <div className="w-8 h-8 rounded-xl bg-background-custom border border-border-custom flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getIcon(item.type, item.severity)}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-text-custom truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-text-muted whitespace-nowrap">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!item.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(item._id, e)}
                        className="p-1 rounded text-text-muted hover:text-primary transition-colors"
                        title="Mark read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(item._id, e)}
                      className="p-1 rounded text-text-muted hover:text-rose-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

