import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/adminService';
import { UpdateRoleSchema, CreateReportSchema } from '../validators/adminValidator';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getDashboardStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const role = req.query.role as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const result = await adminService.getUsers({ page, limit, role, status, search });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    return res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const validatedData = UpdateRoleSchema.parse(req.body);
    const user = await adminService.updateUserRole(
      req.user._id.toString(),
      req.params.id,
      validatedData.role
    );

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully.',
      data: { user }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Validation failed.'
      });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const banUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const user = await adminService.banUser(req.user._id.toString(), req.params.id);
    return res.status(200).json({
      success: true,
      message: 'User permanently banned successfully.',
      data: { user }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const unbanUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const user = await adminService.unbanUser(req.user._id.toString(), req.params.id);
    return res.status(200).json({
      success: true,
      message: 'User unbanned successfully.',
      data: { user }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getPendingApprovals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await adminService.getPendingApprovals({ page, limit });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const approveUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const user = await adminService.approveUser(req.user._id.toString(), req.params.id);
    return res.status(200).json({
      success: true,
      message: 'User account approved successfully.',
      data: { user }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const user = await adminService.rejectUser(req.user._id.toString(), req.params.id);
    return res.status(200).json({
      success: true,
      message: 'User account rejected successfully.',
      data: { user }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const validatedData = CreateReportSchema.parse(req.body);
    const report = await adminService.createReport(req.user._id, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully.',
      data: { report }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Validation failed.'
      });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const status = req.query.status as string;
    const targetType = req.query.targetType as string;

    const result = await adminService.getReports({ page, limit, status, targetType });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const resolveReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const report = await adminService.resolveReport(req.user._id.toString(), req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Report resolved successfully.',
      data: { report }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await adminService.getAuditLogs({ page, limit });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
