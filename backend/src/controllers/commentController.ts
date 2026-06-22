import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/commentService';

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { targetId, targetType, content } = req.body;
    if (!targetId || !targetType || !content) {
      return res.status(400).json({
        success: false,
        message: 'targetId, targetType, and content are required.'
      });
    }

    const comment = await commentService.createComment(
      req.user._id,
      targetId,
      targetType,
      content
    );

    return res.status(201).json({
      success: true,
      message: 'Comment created successfully.',
      data: { comment }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create comment.'
    });
  }
};

export const createReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required.'
      });
    }

    const reply = await commentService.createReply(
      req.user._id,
      req.params.id, // parent comment ID
      content
    );

    return res.status(201).json({
      success: true,
      message: 'Reply created successfully.',
      data: { reply }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create reply.'
    });
  }
};

export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required for update.'
      });
    }

    const comment = await commentService.updateComment(req.params.id, content);
    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully.',
      data: { comment }
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await commentService.deleteComment(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.'
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

export const getCommentsByTarget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetId, targetType } = req.query;
    if (!targetId || !targetType) {
      return res.status(400).json({
        success: false,
        message: 'targetId and targetType query parameters are required.'
      });
    }

    const comments = await commentService.getCommentsByTarget(
      targetId as string,
      targetType as any
    );

    return res.status(200).json({
      success: true,
      data: { comments }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch comments.'
    });
  }
};
