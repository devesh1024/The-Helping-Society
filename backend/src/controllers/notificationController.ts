import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notificationService';
import { CreateNotificationSchema } from '../validators/notificationValidator';

export const createNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const validatedData = CreateNotificationSchema.parse(req.body);
    const notification = await notificationService.createNotification(validatedData);

    return res.status(201).json({
      success: true,
      message: 'Notification created successfully.',
      data: { notification }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Validation failed.'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create notification.'
    });
  }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await notificationService.getNotifications(req.user._id, { page, limit });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve notifications.'
    });
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const notification = await notificationService.markAsRead(req.user._id, req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read successfully.',
      data: { notification }
    });
  } catch (error: any) {
    const statusCode = error.message.includes('Access denied') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to mark notification as read.'
    });
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    await notificationService.markAllAsRead(req.user._id);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read successfully.'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to mark all notifications as read.'
    });
  }
};
