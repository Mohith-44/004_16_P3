import type { Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const filter: Record<string, unknown> = {};
    if (userId && userRole) {
      filter.$or = [
        { recipient: userId },
        { targetRoles: userRole },
        { targetRoles: { $size: 0 } },
      ];
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const formatted = notifications.map((n) => {
      const isRead = userId ? n.readBy.some((id) => String(id) === String(userId)) : false;
      return {
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        severity: n.severity,
        reportId: n.reportId,
        reportRef: n.reportRef,
        isRead,
        createdAt: n.createdAt,
      };
    });

    const unreadCount = formatted.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      notifications: formatted,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    );

    if (!notification) {
      throw new AppError('Notification not found.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification,
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    await Notification.updateMany(
      {
        $or: [{ recipient: req.user._id }, { targetRoles: req.user.role }],
      },
      { $addToSet: { readBy: req.user._id } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (err) {
    next(err);
  }
}
