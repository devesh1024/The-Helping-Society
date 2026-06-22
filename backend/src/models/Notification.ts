import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId?: mongoose.Types.ObjectId | null; // Null indicates it's a global notification
  senderId?: mongoose.Types.ObjectId | null;
  type: 
    | 'global' 
    | 'comment' 
    | 'reply' 
    | 'resourceApproved' 
    | 'resourceRejected' 
    | 'resourceLiked' 
    | 'resourceUploaded' 
    | 'opportunityPosted' 
    | 'userApproved' 
    | 'userBanned';
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  type: { 
    type: String, 
    enum: [
      'global', 
      'comment', 
      'reply', 
      'resourceApproved', 
      'resourceRejected', 
      'resourceLiked', 
      'resourceUploaded', 
      'opportunityPosted', 
      'userApproved', 
      'userBanned'
    ], 
    required: true 
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  link: { type: String, default: null },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
