import { z } from 'zod';

const opportunityTypeEnum = z.enum(['internship', 'job', 'workshop', 'mentorship', 'hackathon'], {
  errorMap: () => ({ message: "Type must be one of 'internship', 'job', 'workshop', 'mentorship', or 'hackathon'" })
});

export const CreateOpportunitySchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters long').max(150, 'Title cannot exceed 150 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters long').max(2000, 'Description cannot exceed 2000 characters'),
  type: opportunityTypeEnum,
  link: z.string().url('Opportunity link must be a valid absolute HTTP or HTTPS URL.'),
  company: z.string().optional(),
  location: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(['open', 'closed']).optional().default('open'),
  eventAt: z.string().optional(),
  conductedBy: z.string().optional(),
  mode: z.string().optional(),
  workType: z.string().optional()
});

export const UpdateOpportunitySchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters long').max(150, 'Title cannot exceed 150 characters').optional(),
  description: z.string().min(5, 'Description must be at least 5 characters long').max(2000, 'Description cannot exceed 2000 characters').optional(),
  type: opportunityTypeEnum.optional(),
  link: z.string().url('Opportunity link must be a valid absolute HTTP or HTTPS URL.').optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(['open', 'closed']).optional(),
  eventAt: z.string().optional(),
  conductedBy: z.string().optional(),
  mode: z.string().optional(),
  workType: z.string().optional()
});
