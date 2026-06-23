import { z } from 'zod';

const branchEnum = z.enum(['cs', 'ce', 'ec', 'ee', 'me', 'cm'], {
  errorMap: () => ({ message: "Branch must be one of 'cs', 'ce', 'ec', 'ee', 'me', or 'cm'" })
});

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters long').max(100, 'Full name cannot exceed 100 characters').optional(),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number cannot exceed 15 digits').optional(),
  // Student-specific fields
  branch: branchEnum.optional(),
  yearOfRegistration: z.number().int().min(2000).max(new Date().getFullYear()).optional(),
  dob: z.preprocess(
    (val) => (typeof val === 'string' ? new Date(val) : val),
    z.date().optional()
  ),
  // Contributor-specific fields
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters long').max(100).optional(),
  roleInOrganization: z.string().min(2, 'Role in organization must be at least 2 characters long').max(100).optional()
});
