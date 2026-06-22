import { Request, Response, NextFunction } from 'express';
import * as supportService from '../services/supportService';
import { CreateSupportRequestSchema, UpdateSupportRequestSchema } from '../validators/supportValidator';

export const createSupportRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const validatedData = CreateSupportRequestSchema.parse(req.body);
    const request = await supportService.createSupportRequest(req.user._id, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Support request created successfully.',
      data: { request }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Validation failed.'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create support request.'
    });
  }
};

export const getSupportRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const status = req.query.status as string;
    const ownerId = req.query.ownerId as string;
    
    let isEmergency: boolean | undefined = undefined;
    if (req.query.isEmergency !== undefined) {
      isEmergency = req.query.isEmergency === 'true';
    }

    const result = await supportService.getSupportRequests(req.user._id, req.user.role, {
      page,
      limit,
      status,
      isEmergency,
      ownerId
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve support requests.'
    });
  }
};

export const getSupportRequestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const request = await supportService.getSupportRequestById(req.user._id, req.user.role, req.params.id);

    return res.status(200).json({
      success: true,
      data: { request }
    });
  } catch (error: any) {
    const statusCode = error.message.includes('Access denied') ? 403 : 404;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve support request.'
    });
  }
};

export const updateSupportRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const validatedData = UpdateSupportRequestSchema.parse(req.body);
    const request = await supportService.updateSupportRequest(
      req.user._id,
      req.user.role,
      req.params.id,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: 'Support request updated successfully.',
      data: { request }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Validation failed.'
      });
    }
    const statusCode = error.message.includes('Forbidden') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update support request.'
    });
  }
};

export const deleteSupportRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    await supportService.deleteSupportRequest(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Support request deleted successfully.'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete support request.'
    });
  }
};

export const approveSupportRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const request = await supportService.approveRequest(req.params.id, req.user._id.toString());

    return res.status(200).json({
      success: true,
      message: 'Support request approved successfully.',
      data: { request }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to approve support request.'
    });
  }
};

export const rejectSupportRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const request = await supportService.rejectRequest(req.params.id, req.user._id.toString());

    return res.status(200).json({
      success: true,
      message: 'Support request rejected successfully.',
      data: { request }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject support request.'
    });
  }
};

export const resolveSupportRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const request = await supportService.resolveRequest(req.params.id, req.user._id, req.user.role);

    return res.status(200).json({
      success: true,
      message: 'Support request resolved successfully.',
      data: { request }
    });
  } catch (error: any) {
    const statusCode = error.message.includes('Forbidden') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to resolve support request.'
    });
  }
};
