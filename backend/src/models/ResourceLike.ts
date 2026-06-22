import mongoose, { Schema, Document } from 'mongoose';

export interface IResourceLike extends Document {
  userId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceLikeSchema = new Schema<IResourceLike>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true }
}, { timestamps: true });

// Compound index to ensure a user can only like a resource once
ResourceLikeSchema.index({ userId: 1, resourceId: 1 }, { unique: true });
ResourceLikeSchema.index({ resourceId: 1 });

export const ResourceLike = mongoose.model<IResourceLike>('ResourceLike', ResourceLikeSchema);
