import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalNotificationRead extends Document {
  userId: mongoose.Types.ObjectId;
  notificationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GlobalNotificationReadSchema = new Schema<IGlobalNotificationRead>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  notificationId: { type: Schema.Types.ObjectId, ref: 'Notification', required: true }
}, { timestamps: true });

// Enforce unique combinations so a user marks a global notification read only once
GlobalNotificationReadSchema.index({ userId: 1, notificationId: 1 }, { unique: true });
GlobalNotificationReadSchema.index({ notificationId: 1 });

export const GlobalNotificationRead = mongoose.model<IGlobalNotificationRead>('GlobalNotificationRead', GlobalNotificationReadSchema);
