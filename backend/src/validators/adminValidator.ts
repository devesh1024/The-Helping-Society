import { z } from 'zod';

export const UpdateRoleSchema = z.object({
  role: z.enum(['student', 'faculty', 'contributor', 'admin', 'alumni'], {
    errorMap: () => ({ message: "Role must be one of 'student', 'faculty', 'contributor', 'admin', or 'alumni'" })
  })
});

export const CreateReportSchema = z.object({
  targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid target ID format'),
  targetType: z.enum(['resource', 'user', 'post', 'opportunity'], {
    errorMap: () => ({ message: "Target type must be 'resource', 'user', 'post', or 'opportunity'" })
  }),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason cannot exceed 500 characters')
});
