import { User } from '../models/User';
import { Resource } from '../models/Resource';
import { ResourceRequest } from '../models/ResourceRequest';
import { Report } from '../models/Report';
import { Opportunity } from '../models/Opportunity';
import { AuditLog } from '../models/AuditLog';
import * as adminRepository from '../repositories/adminRepository';
import { sendEmail } from '../utils/email';
import mongoose from 'mongoose';

export const getDashboardStats = async () => {
  const totalUsers = await User.countDocuments({ status: 'active' });
  const pendingVerifications = await User.countDocuments({
    role: { $in: ['faculty', 'contributor'] },
    status: 'pendingApproval'
  });
  const totalResources = await Resource.countDocuments({});
  const pendingResourceRequests = await ResourceRequest.countDocuments({ status: 'pending' });
  const totalReports = await Report.countDocuments({ status: 'pending' });
  const totalOpportunities = await Opportunity.countDocuments({});

  return {
    totalUsers,
    pendingVerifications,
    totalResources,
    pendingResourceRequests,
    totalReports,
    totalOpportunities
  };
};

export const getUsers = async (query: {
  page: number;
  limit: number;
  role?: string;
  status?: string;
  search?: string;
}) => {
  const page = Math.max(1, query.page);
  const limit = Math.max(1, Math.min(100, query.limit));
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (query.role) {
    filter.role = query.role;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    filter.$or = [
      { fullName: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } }
    ];
  }

  const users = await adminRepository.findUsersPaginated(filter, skip, limit);
  const total = await adminRepository.countUsers(filter);
  const totalPages = Math.ceil(total / limit);

  return { users, total, page, limit, totalPages };
};

export const getUserById = async (id: string) => {
  const user = await User.findById(id).exec();
  if (!user) {
    throw new Error('User not found.');
  }
  return user;
};

export const updateUserRole = async (adminId: string, id: string, role: string) => {
  if (adminId.toString() === id.toString()) {
    throw new Error('Forbidden: You cannot change your own admin role.');
  }

  const user = await User.findById(id).exec();
  if (!user) {
    throw new Error('User not found.');
  }

  if (user.role === role) {
    throw new Error('User already has this role.');
  }

  const oldRole = user.role;
  // Use direct collection update to bypass discriminator changes restrictions in mongoose models
  await User.collection.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { role } });
  const updatedUser = await User.findById(id).exec();

  // Log in AuditLog
  await AuditLog.create({
    actorId: adminId,
    action: 'roleChange',
    targetId: user._id,
    details: `Changed role for "${user.fullName}" from "${oldRole}" to "${role}"`
  });

  return updatedUser;
};

export const banUser = async (adminId: string, id: string) => {
  const user = await User.findById(id).exec();
  if (!user) {
    throw new Error('User not found.');
  }

  if (user.status === 'banned') {
    throw new Error('User is already banned.');
  }

  if (user.role === 'admin') {
    throw new Error('Forbidden: Admins cannot be banned.');
  }

  user.status = 'banned';
  await user.save();

  // Send Email Notification
  await sendEmail({
    email: user.email,
    subject: 'Your Account Has Been Permanently Banned - The Helping Society',
    html: `<p>Hello ${user.fullName},</p><p>We regret to inform you that your account has been permanently banned by an Administrator due to violation of community policies.</p><p>If you believe this was an error, contact support.</p>`
  });

  // Log in AuditLog
  await AuditLog.create({
    actorId: adminId,
    action: 'ban',
    targetId: user._id,
    details: `Permanently banned user: "${user.fullName}" (${user.email})`
  });

  return user;
};

export const unbanUser = async (adminId: string, id: string) => {
  const user = await User.findById(id).exec();
  if (!user) {
    throw new Error('User not found.');
  }

  if (user.status !== 'banned') {
    throw new Error('User is not banned.');
  }

  user.status = 'active';
  await user.save();

  // Log in AuditLog
  await AuditLog.create({
    actorId: adminId,
    action: 'approval', // unban is categorized under approval
    targetId: user._id,
    details: `Unbanned user: "${user.fullName}"`
  });

  return user;
};

export const getPendingApprovals = async (query: { page: number; limit: number }) => {
  const page = Math.max(1, query.page);
  const limit = Math.max(1, Math.min(100, query.limit));
  const skip = (page - 1) * limit;

  const filter = {
    role: { $in: ['faculty', 'contributor'] },
    status: 'pendingApproval'
  };

  const users = await adminRepository.findUsersPaginated(filter, skip, limit);
  const total = await adminRepository.countUsers(filter);
  const totalPages = Math.ceil(total / limit);

  return { users, total, page, limit, totalPages };
};

export const approveUser = async (adminId: string, id: string) => {
  const user = await User.findById(id).exec();
  if (!user) {
    throw new Error('User not found.');
  }

  if (user.status !== 'pendingApproval' && user.status !== 'disabled') {
    throw new Error(`User status is ${user.status}, approval/activation not applicable.`);
  }

  const oldStatus = user.status;
  user.status = 'active';
  await user.save();

  // Log in AuditLog
  await AuditLog.create({
    actorId: adminId,
    action: 'approval',
    targetId: user._id,
    details: oldStatus === 'disabled' 
      ? `Re-activated/Enabled user account: "${user.fullName}" (${user.role})`
      : `Approved account registration for: "${user.fullName}" (${user.role})`
  });

  return user;
};

export const rejectUser = async (adminId: string, id: string) => {
  const user = await User.findById(id).exec();
  if (!user) {
    throw new Error('User not found.');
  }

  if (user.status !== 'pendingApproval' && user.status !== 'active') {
    throw new Error(`User status is ${user.status}, rejection/disablement not applicable.`);
  }

  const oldStatus = user.status;
  user.status = 'disabled';
  await user.save();

  // Log in AuditLog
  await AuditLog.create({
    actorId: adminId,
    action: 'rejection',
    targetId: user._id,
    details: oldStatus === 'active'
      ? `Disabled user account: "${user.fullName}" (${user.role})`
      : `Rejected account registration for: "${user.fullName}" (${user.role})`
  });

  return user;
};

export const createReport = async (
  reportedBy: string | mongoose.Types.ObjectId,
  data: { targetId: string; targetType: string; reason: string }
) => {
  return Report.create({
    reportedBy,
    targetId: data.targetId,
    targetType: data.targetType,
    reason: data.reason,
    status: 'pending'
  });
};

export const getReports = async (query: {
  page: number;
  limit: number;
  status?: string;
  targetType?: string;
}) => {
  const page = Math.max(1, query.page);
  const limit = Math.max(1, Math.min(100, query.limit));
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.targetType) {
    filter.targetType = query.targetType;
  }

  const reports = await adminRepository.findReportsPaginated(filter, skip, limit);
  const total = await adminRepository.countReports(filter);
  const totalPages = Math.ceil(total / limit);

  return { reports, total, page, limit, totalPages };
};

export const resolveReport = async (adminId: string, id: string) => {
  const report = await Report.findById(id).exec();
  if (!report) {
    throw new Error('Report not found.');
  }

  if (report.status === 'resolved') {
    throw new Error('Report is already resolved.');
  }

  report.status = 'resolved';
  report.resolvedBy = new mongoose.Types.ObjectId(adminId);
  await report.save();

  return report;
};

export const getAuditLogs = async (query: { page: number; limit: number }) => {
  const page = Math.max(1, query.page);
  const limit = Math.max(1, Math.min(100, query.limit));
  const skip = (page - 1) * limit;

  const logs = await adminRepository.findAuditLogsPaginated({}, skip, limit);
  const total = await adminRepository.countAuditLogs({});
  const totalPages = Math.ceil(total / limit);

  return { logs, total, page, limit, totalPages };
};
