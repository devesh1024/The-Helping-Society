import { Opportunity, IOpportunity } from '../models/Opportunity';

export const createOpportunity = async (data: any): Promise<IOpportunity> => {
  return Opportunity.create(data);
};

export const findOpportunityById = async (id: string): Promise<IOpportunity | null> => {
  return Opportunity.findById(id).exec();
};

export const findOpportunitiesPaginated = async (
  filter: any,
  skip: number,
  limit: number
): Promise<IOpportunity[]> => {
  return Opportunity.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

export const countOpportunities = async (filter: any): Promise<number> => {
  return Opportunity.countDocuments(filter).exec();
};

export const updateOpportunity = async (
  id: string,
  updateData: any
): Promise<IOpportunity | null> => {
  return Opportunity.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
};

export const deleteOpportunity = async (id: string): Promise<any> => {
  return Opportunity.findByIdAndDelete(id).exec();
};
