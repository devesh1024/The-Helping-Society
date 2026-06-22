import * as commentRepository from '../repositories/commentRepository';
import mongoose from 'mongoose';

export const createComment = async (
  ownerId: string | mongoose.Types.ObjectId,
  targetId: string | mongoose.Types.ObjectId,
  targetType: 'resource' | 'lostFound' | 'room' | 'marketplace',
  content: string
) => {
  return commentRepository.createComment({
    ownerId,
    targetId,
    targetType,
    content,
    parentId: null
  });
};

export const createReply = async (
  ownerId: string | mongoose.Types.ObjectId,
  parentId: string,
  content: string
) => {
  const parentComment = await commentRepository.findById(parentId);
  if (!parentComment) {
    throw new Error('Parent comment not found.');
  }

  // Pre-save schema validator will trigger if parentComment itself has a parentId,
  // but throwing explicitly here makes error messages cleaner.
  if (parentComment.parentId) {
    throw new Error('Nesting depth limit exceeded: Replies are limited to 1 level.');
  }

  return commentRepository.createComment({
    ownerId,
    targetId: parentComment.targetId,
    targetType: parentComment.targetType,
    parentId: parentComment._id,
    content
  });
};

export const updateComment = async (id: string, content: string) => {
  const comment = await commentRepository.findById(id);
  if (!comment) {
    throw new Error('Comment not found.');
  }

  comment.content = content;
  await comment.save();
  return comment;
};

export const deleteComment = async (id: string) => {
  const comment = await commentRepository.findById(id);
  if (!comment) {
    throw new Error('Comment not found.');
  }
  await commentRepository.deleteComment(id);
  return comment;
};

export const getCommentsByTarget = async (
  targetId: string | mongoose.Types.ObjectId,
  targetType: 'resource' | 'lostFound' | 'room' | 'marketplace'
) => {
  const list = await commentRepository.findByTarget(targetId, targetType);
  
  // Separate parents and replies
  const parents = list.filter((c) => !c.parentId);
  const replies = list.filter((c) => c.parentId);

  // Nest replies inside their parent comments
  return parents.map((parent) => {
    const parentObj = parent.toObject();
    return {
      ...parentObj,
      replies: replies
        .filter((r) => r.parentId?.toString() === parent._id.toString())
        .map((r) => r.toObject())
    };
  });
};
