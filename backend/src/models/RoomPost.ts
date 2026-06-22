import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomPost extends Document {
  title: string;
  description: string;
  price: number;
  location: string;
  contactNumber: string;
  images: string[];
  ownerId: mongoose.Types.ObjectId;
  expiresAt: Date; // TTL date (7 days from creation)
  createdAt: Date;
  updatedAt: Date;
}

const RoomPostSchema = new Schema<IRoomPost>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  location: { type: String, required: true, trim: true },
  contactNumber: { type: String, required: true, trim: true },
  images: { type: [String], default: [] },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { 
    type: Date, 
    required: true, 
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
  }
}, { timestamps: true });

// TTL index to automatically delete posts after 7 days
RoomPostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RoomPostSchema.index({ ownerId: 1 });
RoomPostSchema.index({ createdAt: -1 });

export const RoomPost = mongoose.model<IRoomPost>('RoomPost', RoomPostSchema);
