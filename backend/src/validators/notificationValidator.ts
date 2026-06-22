import { z } from 'zod';

const notificationTypeEnum = z.enum([
  'global',
  'comment',
  'reply',
  'resourceApproved',
  'resourceRejected',
  'resourceLiked',
  'resourceUploaded',
  'opportunityPosted',
  'userApproved',
  'userBanned'
]);

export const CreateNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  message: z.string().min(1, 'Message is required').max(500, 'Message cannot exceed 500 characters'),
  type: notificationTypeEnum,
  recipientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid recipient ID format').nullable().optional(),
  link: z.string().max(255, 'Link URL/path is too long').nullable().optional()
});
