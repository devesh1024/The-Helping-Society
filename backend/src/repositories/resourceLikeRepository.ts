import { ResourceLike, IResourceLike } from '../models/ResourceLike';
import mongoose from 'mongoose';

export const addLike = async (
  userId: string | mongoose.Types.ObjectId,
  resourceId: string | mongoose.Types.ObjectId
): Promise<IResourceLike> => {
  return ResourceLike.create({ userId, resourceId });
};

export const removeLike = async (
  userId: string | mongoose.Types.ObjectId,
  resourceId: string | mongoose.Types.ObjectId
): Promise<any> => {
  return ResourceLike.deleteOne({ userId, resourceId }).exec();
};

export const findLike = async (
  userId: string | mongoose.Types.ObjectId,
  resourceId: string | mongoose.Types.ObjectId
): Promise<IResourceLike | null> => {
  return ResourceLike.findOne({ userId, resourceId }).exec();
};
