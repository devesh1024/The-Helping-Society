import { SupportRequest, ISupportRequest } from '../models/SupportRequest';

export const createSupportRequest = async (data: any): Promise<ISupportRequest> => {
  return SupportRequest.create(data);
};

export const findSupportRequestById = async (id: string): Promise<ISupportRequest | null> => {
  return SupportRequest.findById(id).exec();
};

export const findSupportRequestsPaginated = async (
  filter: any,
  skip: number,
  limit: number
): Promise<ISupportRequest[]> => {
  return SupportRequest.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

export const countSupportRequests = async (filter: any): Promise<number> => {
  return SupportRequest.countDocuments(filter).exec();
};

export const updateSupportRequest = async (
  id: string,
  updateData: any
): Promise<ISupportRequest | null> => {
  return SupportRequest.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
};

export const deleteSupportRequest = async (id: string): Promise<any> => {
  return SupportRequest.findByIdAndDelete(id).exec();
};
