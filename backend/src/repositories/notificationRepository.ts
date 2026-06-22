import { Notification, INotification } from '../models/Notification';
import { GlobalNotificationRead, IGlobalNotificationRead } from '../models/GlobalNotificationRead';
import mongoose from 'mongoose';

export const createNotification = async (data: any): Promise<INotification> => {
  return Notification.create(data);
};

export const findNotificationById = async (id: string): Promise<INotification | null> => {
  return Notification.findById(id).exec();
};

export const updateNotification = async (
  id: string,
  updateData: any
): Promise<INotification | null> => {
  return Notification.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
};

export const findPersonalAndGlobal = async (
  userId: string | mongoose.Types.ObjectId,
  skip: number,
  limit: number
): Promise<INotification[]> => {
  return Notification.find({
    $or: [
      { recipientId: userId },
      { recipientId: null }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

export const countPersonalAndGlobal = async (
  userId: string | mongoose.Types.ObjectId
): Promise<number> => {
  return Notification.countDocuments({
    $or: [
      { recipientId: userId },
      { recipientId: null }
    ]
  }).exec();
};

export const createGlobalNotificationRead = async (
  userId: string | mongoose.Types.ObjectId,
  notificationId: string | mongoose.Types.ObjectId
): Promise<IGlobalNotificationRead> => {
  return GlobalNotificationRead.create({ userId, notificationId });
};

export const findGlobalNotificationRead = async (
  userId: string | mongoose.Types.ObjectId,
  notificationId: string | mongoose.Types.ObjectId
): Promise<IGlobalNotificationRead | null> => {
  return GlobalNotificationRead.findOne({ userId, notificationId }).exec();
};

export const findGlobalNotificationReadsForUser = async (
  userId: string | mongoose.Types.ObjectId,
  notificationIds: (string | mongoose.Types.ObjectId)[]
): Promise<IGlobalNotificationRead[]> => {
  return GlobalNotificationRead.find({
    userId,
    notificationId: { $in: notificationIds }
  }).exec();
};

export const bulkCreateGlobalNotificationReads = async (
  records: { userId: any; notificationId: any }[]
): Promise<any> => {
  if (records.length === 0) return [];
  // Use ordered: false to skip duplicate key violations and insert the remaining records
  try {
    return await GlobalNotificationRead.insertMany(records, { ordered: false });
  } catch (error: any) {
    // If it's a validation or write error, we still return since some records might have inserted successfully
    return error.insertedDocs || [];
  }
};

export const updateManyPersonalRead = async (
  userId: string | mongoose.Types.ObjectId
): Promise<any> => {
  return Notification.updateMany(
    { recipientId: userId, isRead: false },
    { $set: { isRead: true } }
  ).exec();
};

export const findUnreadGlobalNotifications = async (
  userId: string | mongoose.Types.ObjectId
): Promise<INotification[]> => {
  // First find all global notifications
  const globalNotifications = await Notification.find({ recipientId: null }).exec();
  const globalIds = globalNotifications.map((n) => n._id);

  // Find which ones the user has read
  const readRecords = await GlobalNotificationRead.find({
    userId,
    notificationId: { $in: globalIds }
  }).exec();
  const readIds = new Set(readRecords.map((r) => r.notificationId.toString()));

  // Return global notifications that the user has not read yet
  return globalNotifications.filter((n) => !readIds.has(n._id.toString()));
};
