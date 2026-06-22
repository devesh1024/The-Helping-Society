import { ResourceRequest, IResourceRequest } from '../models/ResourceRequest';

export const createRequest = async (data: any): Promise<IResourceRequest> => {
  return ResourceRequest.create(data);
};

export const findById = async (id: string): Promise<IResourceRequest | null> => {
  return ResourceRequest.findById(id).exec();
};

export const findPaginated = async (
  filter: any,
  skip: number,
  limit: number
): Promise<IResourceRequest[]> => {
  return ResourceRequest.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

export const countDocuments = async (filter: any): Promise<number> => {
  return ResourceRequest.countDocuments(filter).exec();
};

export const updateRequest = async (
  id: string,
  updateData: any
): Promise<IResourceRequest | null> => {
  return ResourceRequest.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
};

export const deleteRequest = async (id: string): Promise<any> => {
  return ResourceRequest.findByIdAndDelete(id).exec();
};
