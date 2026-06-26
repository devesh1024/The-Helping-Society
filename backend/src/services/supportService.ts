import * as supportRepository from '../repositories/supportRepository';
import { AuditLog } from '../models/AuditLog';
import { SupportReply } from '../models/SupportReply';
import { User } from '../models/User';
import { createNotification } from './notificationService';
import mongoose from 'mongoose';

export const createSupportRequest = async (
  ownerId: string | mongoose.Types.ObjectId,
  data: {
    title: string;
    description: string;
    contactNumber?: string;
    location?: string;
    images?: string[];
    isEmergency?: boolean;
    anonymous?: boolean;
  }
) => {
  const isEmergency = data.isEmergency || false;
  // If emergency, go live instantly
  const status = isEmergency ? 'approved' : 'pending';

  const request = await supportRepository.createSupportRequest({
    ...data,
    ownerId,
    status
  });

  // Trigger Notifications:
  try {
    if (isEmergency) {
      // 1. Emergency support request -> global notification
      await createNotification({
        title: 'New Support Emergency',
        message: `Emergency Support Request: "${request.title}"`,
        type: 'global',
        recipientId: null,
        link: '/support'
      });
    } else {
      // 2. Standard support request -> notify all admin users
      const admins = await User.find({ role: 'admin' }).select('_id').exec();
      const notificationPromises = admins.map(admin => 
        createNotification({
          title: 'Support Request Needs Approval',
          message: `A new support request "${request.title}" needs your approval.`,
          type: 'global',
          recipientId: admin._id.toString(),
          link: '/support'
        })
      );
      await Promise.all(notificationPromises);
    }
  } catch (err) {
    console.error('Failed to trigger support request notifications:', err);
  }

  return request;
};

export const getSupportRequests = async (
  userId: string | mongoose.Types.ObjectId,
  role: string,
  query: {
    page: number;
    limit: number;
    status?: string;
    isEmergency?: boolean;
    ownerId?: string;
  }
) => {
  const page = Math.max(1, query.page);
  const limit = Math.max(1, Math.min(100, query.limit));
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.isEmergency !== undefined) {
    filter.isEmergency = query.isEmergency;
  }

  if (query.ownerId) {
    filter.ownerId = query.ownerId;
  }

  // Role visibility controls
  if (role !== 'admin') {
    // Non-admin can only see their own requests OR approved/resolved requests
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { ownerId: userId },
          { status: { $in: ['approved', 'resolved'] } }
        ]
      }
    ];
  }

  const posts = await supportRepository.findSupportRequestsPaginated(filter, skip, limit);
  const total = await supportRepository.countSupportRequests(filter);
  const totalPages = Math.ceil(total / limit);

  return { posts, total, page, limit, totalPages };
};

export const getSupportRequestById = async (
  userId: string | mongoose.Types.ObjectId,
  role: string,
  id: string
) => {
  const request = await supportRepository.findSupportRequestById(id);
  if (!request) {
    throw new Error('Support request not found.');
  }

  // Non-admins can only view if owner or if request is live (approved/resolved)
  if (role !== 'admin') {
    const isOwner = request.ownerId.toString() === userId.toString();
    const isLive = ['approved', 'resolved'].includes(request.status);
    if (!isOwner && !isLive) {
      throw new Error('Access denied: Forbidden support request.');
    }
  }

  return request;
};

export const updateSupportRequest = async (
  userId: string | mongoose.Types.ObjectId,
  role: string,
  id: string,
  updateData: {
    title?: string;
    description?: string;
    contactNumber?: string;
    location?: string;
    images?: string[];
    isEmergency?: boolean;
    status?: string;
  }
) => {
  const request = await supportRepository.findSupportRequestById(id);
  if (!request) {
    throw new Error('Support request not found.');
  }

  // Prevent standard users from setting statuses other than resolved
  if (role !== 'admin') {
    if (updateData.status && updateData.status !== 'resolved') {
      throw new Error('Forbidden status update: Students/Faculty can only mark requests as resolved.');
    }
  }

  const isEmergency = updateData.isEmergency !== undefined ? updateData.isEmergency : request.isEmergency;

  const safeUpdate: any = {};
  if (updateData.title !== undefined) safeUpdate.title = updateData.title;
  if (updateData.description !== undefined) safeUpdate.description = updateData.description;
  if (updateData.contactNumber !== undefined) safeUpdate.contactNumber = updateData.contactNumber;
  if (updateData.location !== undefined) safeUpdate.location = updateData.location;
  if (updateData.images !== undefined) safeUpdate.images = updateData.images;
  if (updateData.isEmergency !== undefined) safeUpdate.isEmergency = updateData.isEmergency;
  if (updateData.status !== undefined) safeUpdate.status = updateData.status;

  if (isEmergency) {
    // If it's emergency (either originally or set now), status must be approved
    safeUpdate.status = 'approved';
  } else {
    // Standard request: if modified by owner, and previously approved or rejected, reset status to pending
    const isModified =
      updateData.title !== undefined ||
      updateData.description !== undefined ||
      updateData.contactNumber !== undefined ||
      updateData.location !== undefined;

    if (role !== 'admin' && isModified && (request.status === 'approved' || request.status === 'rejected')) {
      safeUpdate.status = 'pending';
    }
  }

  const updated = await supportRepository.updateSupportRequest(id, safeUpdate);
  if (!updated) {
    throw new Error('Support request not found.');
  }

  return updated;
};

export const deleteSupportRequest = async (id: string) => {
  const deleted = await supportRepository.deleteSupportRequest(id);
  if (!deleted) {
    throw new Error('Support request not found.');
  }
  return deleted;
};

export const approveRequest = async (id: string, adminId: string) => {
  const request = await supportRepository.findSupportRequestById(id);
  if (!request) {
    throw new Error('Support request not found.');
  }

  if (request.status === 'approved') {
    throw new Error('Support request is already approved.');
  }

  const updated = await supportRepository.updateSupportRequest(id, { status: 'approved' });

  // Record AuditLog
  await AuditLog.create({
    actorId: adminId,
    action: 'approval',
    targetId: request._id,
    details: `Approved support request: "${request.title}"`
  });

  // Trigger Notification to request owner
  try {
    await createNotification({
      title: 'Support Request Approved',
      message: `Your support request "${request.title}" has been approved.`,
      type: 'global',
      recipientId: request.ownerId.toString(),
      link: '/support'
    });
  } catch (err) {
    console.error('Failed to notify support owner of approval:', err);
  }

  return updated;
};

export const rejectRequest = async (id: string, adminId: string) => {
  const request = await supportRepository.findSupportRequestById(id);
  if (!request) {
    throw new Error('Support request not found.');
  }

  if (request.status === 'rejected') {
    throw new Error('Support request is already rejected.');
  }

  const updated = await supportRepository.updateSupportRequest(id, { status: 'rejected' });

  // Record AuditLog
  await AuditLog.create({
    actorId: adminId,
    action: 'rejection',
    targetId: request._id,
    details: `Rejected support request: "${request.title}"`
  });

  // Trigger Notification to request owner
  try {
    await createNotification({
      title: 'Support Request Rejected',
      message: `Your support request "${request.title}" has been rejected.`,
      type: 'global',
      recipientId: request.ownerId.toString(),
      link: '/support'
    });
  } catch (err) {
    console.error('Failed to notify support owner of rejection:', err);
  }

  return updated;
};

export const resolveRequest = async (
  id: string,
  actorId: string | mongoose.Types.ObjectId,
  role: string
) => {
  const request = await supportRepository.findSupportRequestById(id);
  if (!request) {
    throw new Error('Support request not found.');
  }

  // Authorization check
  if (role !== 'admin' && request.ownerId.toString() !== actorId.toString()) {
    throw new Error('Forbidden: You do not have permission to resolve this support request.');
  }

  if (request.status === 'resolved') {
    throw new Error('Support request is already resolved.');
  }

  const updated = await supportRepository.updateSupportRequest(id, { status: 'resolved' });

  // Trigger Notification to request owner
  try {
    await createNotification({
      title: 'Support Request Resolved',
      message: `Your support request "${request.title}" has been resolved.`,
      type: 'global',
      recipientId: request.ownerId.toString(),
      link: '/support'
    });
  } catch (err) {
    console.error('Failed to notify support owner of resolution:', err);
  }

  return updated;
};

export const createSupportReply = async (
  userId: string | mongoose.Types.ObjectId,
  role: string,
  supportRequestId: string,
  message: string
) => {
  const request = await supportRepository.findSupportRequestById(supportRequestId);
  if (!request) {
    throw new Error('Support request not found.');
  }

  // Authorization check: Only the request owner or an admin can reply
  if (role !== 'admin' && request.ownerId.toString() !== userId.toString()) {
    throw new Error('Forbidden: You do not have permission to reply to this support request.');
  }

  const reply = await SupportReply.create({
    supportRequestId,
    authorId: userId,
    message
  });

  // Trigger Notification
  try {
    if (userId.toString() !== request.ownerId.toString()) {
      // If replier is admin, notify request owner
      await createNotification({
        title: 'New Reply on Support Request',
        message: `An administrator has replied to your request: "${request.title}"`,
        type: 'reply',
        recipientId: request.ownerId.toString(),
        link: '/support'
      });
    } else {
      // If replier is request owner, notify all admins
      const admins = await User.find({ role: 'admin' }).select('_id').exec();
      const notificationPromises = admins.map(admin => 
        createNotification({
          title: 'New Reply on Support Request',
          message: `User replied to support request: "${request.title}"`,
          type: 'reply',
          recipientId: admin._id.toString(),
          link: '/support'
        })
      );
      await Promise.all(notificationPromises);
    }
  } catch (err) {
    console.error('Failed to notify support reply:', err);
  }

  return reply;
};

export const getSupportReplies = async (
  userId: string | mongoose.Types.ObjectId,
  role: string,
  supportRequestId: string
) => {
  const request = await supportRepository.findSupportRequestById(supportRequestId);
  if (!request) {
    throw new Error('Support request not found.');
  }

  // Authorization check: Only the request owner or an admin can view replies
  if (role !== 'admin' && request.ownerId.toString() !== userId.toString()) {
    throw new Error('Forbidden: You do not have permission to view replies for this support request.');
  }

  return SupportReply.find({ supportRequestId })
    .sort({ createdAt: 1 })
    .exec();
};
