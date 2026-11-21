import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const data = await notificationService.getUserNotifications(userId);
    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const { id } = req.params;
    const notification = await notificationService.markAsRead(userId, id);
    if (!notification) {
      res.status(404).json({ status: 'fail', message: 'Notification not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    await notificationService.markAllAsRead(userId);
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const { id } = req.params;
    const deleted = await notificationService.deleteNotification(userId, id);
    if (!deleted) {
      res.status(404).json({ status: 'fail', message: 'Notification not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

