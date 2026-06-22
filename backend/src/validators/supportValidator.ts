import { z } from 'zod';

export const CreateSupportRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description cannot exceed 500 characters'),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits').max(15, 'Contact number cannot exceed 15 digits'),
  location: z.string().min(1, 'Location is required').max(200, 'Location description is too long'),
  images: z.array(z.string().url('Invalid image URL')).optional().default([]),
  isEmergency: z.boolean().optional().default(false)
});

export const UpdateSupportRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters').optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description cannot exceed 500 characters').optional(),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits').max(15, 'Contact number cannot exceed 15 digits').optional(),
  location: z.string().min(1, 'Location is required').max(200, 'Location description is too long').optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'resolved']).optional()
});
