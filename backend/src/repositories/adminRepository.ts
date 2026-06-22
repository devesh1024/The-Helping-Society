import { User, IUser } from '../models/User';
import { Report, IReport } from '../models/Report';
import { AuditLog, IAuditLog } from '../models/AuditLog';
import mongoose from 'mongoose';

export const findUsersPaginated = async (
  filter: any,
  skip: number,
  limit: number
): Promise<IUser[]> => {
  return User.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

export const countUsers = async (filter: any): Promise<number> => {
  return User.countDocuments(filter).exec();
};

export const findReportsPaginated = async (
  filter: any,
  skip: number,
  limit: number
): Promise<IReport[]> => {
  return Report.find(filter)
    .populate('reportedBy', 'fullName email')
    .populate('resolvedBy', 'fullName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

export const countReports = async (filter: any): Promise<number> => {
  return Report.countDocuments(filter).exec();
};

export const findAuditLogsPaginated = async (
  filter: any,
  skip: number,
  limit: number
): Promise<IAuditLog[]> => {
  return AuditLog.find(filter)
    .populate('actorId', 'fullName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

export const countAuditLogs = async (filter: any): Promise<number> => {
  return AuditLog.countDocuments(filter).exec();
};
