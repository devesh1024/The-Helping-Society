import { Comment, IComment } from '../models/Comment';
import mongoose from 'mongoose';

export const createComment = async (data: any): Promise<IComment> => {
  return Comment.create(data);
};

export const findById = async (id: string): Promise<IComment | null> => {
  return Comment.findById(id).exec();
};

export const deleteComment = async (id: string): Promise<any> => {
  // Also delete all child replies when deleting a parent comment
  await Comment.deleteMany({ parentId: id }).exec();
  return Comment.findByIdAndDelete(id).exec();
};

export const deleteByTarget = async (
  targetId: string | mongoose.Types.ObjectId,
  targetType: string
): Promise<any> => {
  return Comment.deleteMany({ targetId, targetType }).exec();
};

export const findByTarget = async (
  targetId: string | mongoose.Types.ObjectId,
  targetType: string
): Promise<IComment[]> => {
  return Comment.find({ targetId, targetType })
    .sort({ createdAt: 1 })
    .exec();
};
