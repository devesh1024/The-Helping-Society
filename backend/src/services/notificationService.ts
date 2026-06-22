import * as notificationRepository from '../repositories/notificationRepository';
import mongoose from 'mongoose';

export const createNotification = async (data: {
  title: string;
  message: string;
  type: string;
  recipientId?: string | null;
  link?: string | null;
}) => {
  return notificationRepository.createNotification(data);
};

export const getNotifications = async (
  userId: string | mongoose.Types.ObjectId,
  query: { page: number; limit: number }
) => {
  const page = Math.max(1, query.page);
  const limit = Math.max(1, Math.min(100, query.limit));
  const skip = (page - 1) * limit;

  const notifications = await notificationRepository.findPersonalAndGlobal(userId, skip, limit);
  const total = await notificationRepository.countPersonalAndGlobal(userId);
  const totalPages = Math.ceil(total / limit);

  // Extract global notification IDs to check their read status
  const globalIds = notifications
    .filter((n) => n.recipientId === null || n.recipientId === undefined)
    .map((n) => n._id as mongoose.Types.ObjectId);

  const readRecords = await notificationRepository.findGlobalNotificationReadsForUser(userId, globalIds);
  const readSet = new Set(readRecords.map((r) => r.notificationId.toString()));

  // Map notifications to overlay the dynamic read state for global notifications
  const mappedNotifications = notifications.map((n) => {
    const obj = n.toObject();
    if (obj.recipientId === null || obj.recipientId === undefined) {
      obj.isRead = readSet.has(obj._id.toString());
    }
    return obj;
  });

  return { notifications: mappedNotifications, total, page, limit, totalPages };
};

export const markAsRead = async (
  userId: string | mongoose.Types.ObjectId,
  notificationId: string
) => {
  const notification = await notificationRepository.findNotificationById(notificationId);
  if (!notification) {
    throw new Error('Notification not found.');
  }

  // Personal Notification Read Handler
  if (notification.recipientId) {
    if (notification.recipientId.toString() !== userId.toString()) {
      throw new Error('Access denied: Forbidden notification.');
    }
    return notificationRepository.updateNotification(notificationId, { isRead: true });
  }

  // Global Notification Read Handler (tracks unique read status in GlobalNotificationRead)
  const existingRead = await notificationRepository.findGlobalNotificationRead(userId, notificationId);
  if (!existingRead) {
    await notificationRepository.createGlobalNotificationRead(userId, notificationId);
  }

  return notification;
};

export const markAllAsRead = async (userId: string | mongoose.Types.ObjectId) => {
  // 1. Mark all personal notifications as read
  await notificationRepository.updateManyPersonalRead(userId);

  // 2. Fetch all unread global notifications for the user
  const unreadGlobals = await notificationRepository.findUnreadGlobalNotifications(userId);

  // 3. Bulk insert read records for unread global notifications
  const records = unreadGlobals.map((n) => ({
    userId,
    notificationId: n._id
  }));

  if (records.length > 0) {
    await notificationRepository.bulkCreateGlobalNotificationReads(records);
  }

  return { success: true };
};
