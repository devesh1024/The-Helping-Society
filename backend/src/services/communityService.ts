import * as communityRepository from '../repositories/communityRepository';
import * as commentRepository from '../repositories/commentRepository';
import mongoose from 'mongoose';
import { createNotification } from './notificationService';

// === Lost & Found ===
export const createLostFound = async (
  ownerId: string | mongoose.Types.ObjectId,
  data: { title: string; description: string; contactNumber: string; location: string; images?: string[]; metadata?: any }
) => {
  const post = await communityRepository.createLostFound({
    ...data,
    ownerId,
    status: 'active'
  });

  try {
    await createNotification({
      title: 'New Post in Lost & Found',
      message: `Something new in Lost & Found: ${post.title}`,
      type: 'global',
      recipientId: null,
      link: '/community'
    });
  } catch (err) {
    console.error('Failed to trigger community global notification:', err);
  }

  return post;
};

export const getLostFound = async (query: { page: number; limit: number; status?: string }) => {
  const page = Math.max(1, query.page);
  const limit = Math.max(1, Math.min(100, query.limit));
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (query.status) {
    filter.status = query.status;
  }

  const posts = await communityRepository.findLostFoundPaginated(filter, skip, limit);
  const total = await communityRepository.countLostFound(filter);
  const totalPages = Math.ceil(total / limit);

  return { posts, total, page, limit, totalPages };
};

export const getLostFoundById = async (id: string) => {
  const post = await communityRepository.findLostFoundById(id);
  if (!post) {
    throw new Error('Lost & Found post not found.');
  }
  return post;
};

export const updateLostFound = async (
  id: string,
  updateData: { title?: string; description?: string; contactNumber?: string; location?: string; images?: string[]; metadata?: any }
) => {
  const post = await communityRepository.updateLostFound(id, updateData);
  if (!post) {
    throw new Error('Lost & Found post not found.');
  }
  return post;
};

export const deleteLostFound = async (id: string) => {
  const post = await communityRepository.deleteLostFound(id);
  if (!post) {
    throw new Error('Lost & Found post not found.');
  }
  // Cascade delete all comments targetting this Lost & Found post
  await commentRepository.deleteByTarget(id, 'lostFound');
  return post;
};

export const resolveLostFound = async (id: string) => {
  const updateData = {
    status: 'resolved',
    resolvedAt: new Date(),
    // Set TTL index trigger for deletion in exactly 24 hours
    deleteAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };

  const post = await communityRepository.updateLostFound(id, updateData);
  if (!post) {
    throw new Error('Lost & Found post not found.');
  }
  return post;
};

// === Rooms ===
export const createRoom = async (
  ownerId: string | mongoose.Types.ObjectId,
  data: { title: string; description: string; price: number; location: string; contactNumber: string; images?: string[]; metadata?: any }
) => {
  const post = await communityRepository.createRoom({
    ...data,
    ownerId,
    // Room listings automatically expire and self-delete after 7 days
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  try {
    await createNotification({
      title: 'New Post in Rooms',
      message: `Something new in Rooms: Room at ${post.location}`,
      type: 'global',
      recipientId: null,
      link: '/community'
    });
  } catch (err) {
    console.error('Failed to trigger community global notification:', err);
  }

  return post;
};

export const getRooms = async (query: { page: number; limit: number }) => {
  const page = Math.max(1, query.page);
  const limit = Math.max(1, Math.min(100, query.limit));
  const skip = (page - 1) * limit;

  const posts = await communityRepository.findRoomPaginated({}, skip, limit);
  const total = await communityRepository.countRooms({});
  const totalPages = Math.ceil(total / limit);

  return { posts, total, page, limit, totalPages };
};

export const getRoomById = async (id: string) => {
  const post = await communityRepository.findRoomById(id);
  if (!post) {
    throw new Error('Room post not found.');
  }
  return post;
};

export const updateRoom = async (
  id: string,
  updateData: { title?: string; description?: string; price?: number; location?: string; contactNumber?: string; images?: string[]; metadata?: any }
) => {
  const post = await communityRepository.updateRoom(id, updateData);
  if (!post) {
    throw new Error('Room post not found.');
  }
  return post;
};

export const deleteRoom = async (id: string) => {
  const post = await communityRepository.deleteRoom(id);
  if (!post) {
    throw new Error('Room post not found.');
  }
  // Cascade delete all comments targetting this room post
  await commentRepository.deleteByTarget(id, 'room');
  return post;
};

// === Marketplace ===
export const createMarketplace = async (
  ownerId: string | mongoose.Types.ObjectId,
  data: { title: string; description: string; price: number; contactNumber: string; images: string[]; metadata?: any }
) => {
  const post = await communityRepository.createMarketplace({
    ...data,
    ownerId
  });

  try {
    await createNotification({
      title: 'New Post in Marketplace',
      message: `Something new in Marketplace: ${post.title}`,
      type: 'global',
      recipientId: null,
      link: '/community'
    });
  } catch (err) {
    console.error('Failed to trigger community global notification:', err);
  }

  return post;
};

export const getMarketplace = async (query: { page: number; limit: number }) => {
  const page = Math.max(1, query.page);
  const limit = Math.max(1, Math.min(100, query.limit));
  const skip = (page - 1) * limit;

  const posts = await communityRepository.findMarketplacePaginated({}, skip, limit);
  const total = await communityRepository.countMarketplace({});
  const totalPages = Math.ceil(total / limit);

  return { posts, total, page, limit, totalPages };
};

export const getMarketplaceById = async (id: string) => {
  const post = await communityRepository.findMarketplaceById(id);
  if (!post) {
    throw new Error('Marketplace post not found.');
  }
  return post;
};

export const updateMarketplace = async (
  id: string,
  updateData: { title?: string; description?: string; price?: number; contactNumber?: string; images?: string[]; metadata?: any }
) => {
  const post = await communityRepository.updateMarketplace(id, updateData);
  if (!post) {
    throw new Error('Marketplace post not found.');
  }
  return post;
};

export const deleteMarketplace = async (id: string) => {
  const post = await communityRepository.deleteMarketplace(id);
  if (!post) {
    throw new Error('Marketplace post not found.');
  }
  // Cascade delete all comments targetting this marketplace post
  await commentRepository.deleteByTarget(id, 'marketplace');
  return post;
};
