import * as commentRepository from '../repositories/commentRepository';
import mongoose from 'mongoose';
import { createNotification } from './notificationService';

export const createComment = async (
  ownerId: string | mongoose.Types.ObjectId,
  targetId: string | mongoose.Types.ObjectId,
  targetType: 'resource' | 'lostFound' | 'room' | 'marketplace',
  content: string
) => {
  const comment = await commentRepository.createComment({
    ownerId,
    targetId,
    targetType,
    content,
    parentId: null
  });

  // Trigger notification to the author/owner of the target post (if not the one who commented)
  try {
    let recipientId: mongoose.Types.ObjectId | null = null;
    let targetTitle = '';
    if (targetType === 'lostFound') {
      const post = await mongoose.model('LostFoundPost').findById(targetId);
      if (post) {
        recipientId = post.ownerId;
        targetTitle = post.title;
      }
    } else if (targetType === 'room') {
      const post = await mongoose.model('RoomPost').findById(targetId);
      if (post) {
        recipientId = post.ownerId;
        targetTitle = post.title;
      }
    } else if (targetType === 'marketplace') {
      const post = await mongoose.model('MarketplacePost').findById(targetId);
      if (post) {
        recipientId = post.ownerId;
        targetTitle = post.title;
      }
    } else if (targetType === 'resource') {
      const post = await mongoose.model('Resource').findById(targetId);
      if (post) {
        recipientId = post.uploaderId;
        targetTitle = post.title;
      }
    }

    if (recipientId && recipientId.toString() !== ownerId.toString()) {
      await createNotification({
        title: 'New Reply on Your Post',
        message: `Someone replied to your post: ${targetTitle}`,
        type: 'comment',
        recipientId: recipientId.toString(),
        link: targetType === 'resource' ? `/resources` : `/community`
      });
    }
  } catch (err) {
    console.error('Failed to trigger comment notification:', err);
  }

  return comment;
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

  const reply = await commentRepository.createComment({
    ownerId,
    targetId: parentComment.targetId,
    targetType: parentComment.targetType,
    parentId: parentComment._id,
    content
  });

  // Trigger notification to the parent comment owner (if not the one who replied)
  try {
    if (parentComment.ownerId.toString() !== ownerId.toString()) {
      await createNotification({
        title: 'New Reply to Your Comment',
        message: `Someone replied to your comment: "${parentComment.content.substring(0, 30)}..."`,
        type: 'reply',
        recipientId: parentComment.ownerId.toString(),
        link: parentComment.targetType === 'resource' ? '/resources' : '/community'
      });
    }
  } catch (err) {
    console.error('Failed to trigger reply notification:', err);
  }

  return reply;
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
