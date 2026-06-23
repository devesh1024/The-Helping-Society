import mongoose from 'mongoose';
import * as opportunityRepository from '../repositories/opportunityRepository';
import { IOpportunity } from '../models/Opportunity';
import { createNotification } from './notificationService';

export const createOpportunity = async (
  createdBy: string | mongoose.Types.ObjectId,
  data: { 
    title: string; 
    description: string; 
    type: string; 
    link: string;
    company?: string;
    location?: string;
    deadline?: string;
    status?: 'open' | 'closed';
    eventAt?: string;
    conductedBy?: string;
    mode?: string;
    workType?: string;
  }
): Promise<IOpportunity> => {
  const opp = await opportunityRepository.createOpportunity({
    ...data,
    createdBy
  });

  // Trigger a global notification for the new opportunity
  try {
    await createNotification({
      title: 'New Opportunity Posted',
      message: `A new ${opp.type} opportunity "${opp.title}" has been posted.`,
      type: 'opportunityPosted',
      recipientId: null,
      link: '/opportunities'
    });
  } catch (err) {
    console.error('Failed to trigger opportunity notification:', err);
  }

  return opp;
};

export const getOpportunities = async (query: {
  page: number;
  limit: number;
  type?: string;
  search?: string;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (query.type) {
    filter.type = query.type;
  }

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } }
    ];
  }

  const opportunities = await opportunityRepository.findOpportunitiesPaginated(filter, skip, limit);
  const total = await opportunityRepository.countOpportunities(filter);
  const totalPages = Math.ceil(total / limit);

  return { opportunities, total, page, limit, totalPages };
};

export const getOpportunityById = async (id: string): Promise<IOpportunity> => {
  const opportunity = await opportunityRepository.findOpportunityById(id);
  if (!opportunity) {
    throw new Error('Opportunity not found.');
  }
  return opportunity;
};

export const updateOpportunity = async (
  id: string,
  updateData: { 
    title?: string; 
    description?: string; 
    type?: string; 
    link?: string;
    company?: string;
    location?: string;
    deadline?: string;
    status?: 'open' | 'closed';
    eventAt?: string;
    conductedBy?: string;
    mode?: string;
    workType?: string;
  }
): Promise<IOpportunity> => {
  const opportunity = await opportunityRepository.updateOpportunity(id, updateData);
  if (!opportunity) {
    throw new Error('Opportunity not found.');
  }
  return opportunity;
};

export const deleteOpportunity = async (id: string): Promise<void> => {
  const opportunity = await opportunityRepository.deleteOpportunity(id);
  if (!opportunity) {
    throw new Error('Opportunity not found.');
  }
};
