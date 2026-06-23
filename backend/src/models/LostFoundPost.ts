import mongoose, { Schema, Document } from 'mongoose';

export interface ILostFoundPost extends Document {
  title: string;
  description: string;
  contactNumber: string;
  location: string;
  images: string[];
  metadata?: any;
  status: 'active' | 'resolved';
  ownerId: mongoose.Types.ObjectId;
  resolvedAt?: Date | null;
  deleteAt?: Date | null; // TTL date
  createdAt: Date;
  updatedAt: Date;
}

const LostFoundPostSchema = new Schema<ILostFoundPost>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  contactNumber: { type: String, trim: true, default: '' },
  location: { type: String, trim: true, default: '' },
  images: { type: [String], default: [] },
  metadata: { type: Schema.Types.Mixed, default: {} },
  status: { 
    type: String, 
    enum: ['active', 'resolved'], 
    default: 'active' 
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resolvedAt: { type: Date, default: null },
  deleteAt: { type: Date, default: null }
}, { timestamps: true });

// TTL index to automatically delete resolved posts 24 hours after they are marked resolved
LostFoundPostSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });
LostFoundPostSchema.index({ status: 1 });
LostFoundPostSchema.index({ ownerId: 1 });
LostFoundPostSchema.index({ createdAt: -1 });

export const LostFoundPost = mongoose.model<ILostFoundPost>('LostFoundPost', LostFoundPostSchema);
