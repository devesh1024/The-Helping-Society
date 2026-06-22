import { LostFoundPost, ILostFoundPost } from '../models/LostFoundPost';
import { RoomPost, IRoomPost } from '../models/RoomPost';
import { MarketplacePost, IMarketplacePost } from '../models/MarketplacePost';

// === Lost & Found ===
export const createLostFound = async (data: any): Promise<ILostFoundPost> => {
  return LostFoundPost.create(data);
};

export const findLostFoundById = async (id: string): Promise<ILostFoundPost | null> => {
  return LostFoundPost.findById(id).exec();
};

export const findLostFoundPaginated = async (
  filter: any,
  skip: number,
  limit: number
): Promise<ILostFoundPost[]> => {
  return LostFoundPost.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

export const countLostFound = async (filter: any): Promise<number> => {
  return LostFoundPost.countDocuments(filter).exec();
};

export const updateLostFound = async (
  id: string,
  updateData: any
): Promise<ILostFoundPost | null> => {
  return LostFoundPost.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
};

export const deleteLostFound = async (id: string): Promise<any> => {
  return LostFoundPost.findByIdAndDelete(id).exec();
};

// === Rooms ===
export const createRoom = async (data: any): Promise<IRoomPost> => {
  return RoomPost.create(data);
};

export const findRoomById = async (id: string): Promise<IRoomPost | null> => {
  return RoomPost.findById(id).exec();
};

export const findRoomPaginated = async (
  filter: any,
  skip: number,
  limit: number
): Promise<IRoomPost[]> => {
  return RoomPost.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

export const countRooms = async (filter: any): Promise<number> => {
  return RoomPost.countDocuments(filter).exec();
};

export const updateRoom = async (
  id: string,
  updateData: any
): Promise<IRoomPost | null> => {
  return RoomPost.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
};

export const deleteRoom = async (id: string): Promise<any> => {
  return RoomPost.findByIdAndDelete(id).exec();
};

// === Marketplace ===
export const createMarketplace = async (data: any): Promise<IMarketplacePost> => {
  return MarketplacePost.create(data);
};

export const findMarketplaceById = async (id: string): Promise<IMarketplacePost | null> => {
  return MarketplacePost.findById(id).exec();
};

export const findMarketplacePaginated = async (
  filter: any,
  skip: number,
  limit: number
): Promise<IMarketplacePost[]> => {
  return MarketplacePost.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

export const countMarketplace = async (filter: any): Promise<number> => {
  return MarketplacePost.countDocuments(filter).exec();
};

export const updateMarketplace = async (
  id: string,
  updateData: any
): Promise<IMarketplacePost | null> => {
  return MarketplacePost.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
};

export const deleteMarketplace = async (id: string): Promise<any> => {
  return MarketplacePost.findByIdAndDelete(id).exec();
};
