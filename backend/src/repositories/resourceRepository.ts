import { Resource, IResource } from '../models/Resource';

export const createResource = async (data: any): Promise<IResource> => {
  return Resource.create(data);
};

export const findById = async (id: string): Promise<IResource | null> => {
  return Resource.findById(id).exec();
};

export const findPaginated = async (
  filter: any,
  skip: number,
  limit: number
): Promise<IResource[]> => {
  return Resource.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

export const countDocuments = async (filter: any): Promise<number> => {
  return Resource.countDocuments(filter).exec();
};

export const updateResource = async (
  id: string,
  updateData: any
): Promise<IResource | null> => {
  return Resource.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
};

export const deleteResource = async (id: string): Promise<any> => {
  return Resource.findByIdAndDelete(id).exec();
};

export const incrementLikes = async (id: string): Promise<IResource | null> => {
  return Resource.findByIdAndUpdate(
    id,
    { $inc: { likesCount: 1 } },
    { new: true }
  ).exec();
};

export const decrementLikes = async (id: string): Promise<IResource | null> => {
  return Resource.findByIdAndUpdate(
    id,
    { $inc: { likesCount: -1 } },
    { new: true }
  ).exec();
};
