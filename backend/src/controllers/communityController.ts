import { Request, Response, NextFunction } from 'express';
import * as communityService from '../services/communityService';

// === Lost & Found ===
export const createLostFound = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { title, description, contactNumber, location, images } = req.body;
    if (!title || !description || !contactNumber || !location) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, contactNumber, and location are required.'
      });
    }

    const post = await communityService.createLostFound(req.user._id, {
      title,
      description,
      contactNumber,
      location,
      images
    });

    return res.status(201).json({
      success: true,
      message: 'Lost & Found post created successfully.',
      data: { post }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create Lost & Found post.'
    });
  }
};

export const getLostFound = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const status = req.query.status as string;

    const result = await communityService.getLostFound({ page, limit, status });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch Lost & Found posts.'
    });
  }
};

export const getLostFoundById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await communityService.getLostFoundById(req.params.id);
    return res.status(200).json({
      success: true,
      data: { post }
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

export const updateLostFound = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, contactNumber, location, images } = req.body;
    const post = await communityService.updateLostFound(req.params.id, {
      title,
      description,
      contactNumber,
      location,
      images
    });

    return res.status(200).json({
      success: true,
      message: 'Lost & Found post updated successfully.',
      data: { post }
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteLostFound = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await communityService.deleteLostFound(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Lost & Found post deleted successfully.'
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

export const resolveLostFound = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await communityService.resolveLostFound(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Lost & Found post resolved successfully. Post will automatically delete in 24 hours.',
      data: { post }
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

// === Rooms ===
export const createRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { title, description, price, location, contactNumber, images } = req.body;
    if (!title || !description || price === undefined || !location || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, price, location, and contactNumber are required.'
      });
    }

    const post = await communityService.createRoom(req.user._id, {
      title,
      description,
      price: parseFloat(price),
      location,
      contactNumber,
      images
    });

    return res.status(201).json({
      success: true,
      message: 'Room listing created successfully.',
      data: { post }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create room listing.'
    });
  }
};

export const getRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await communityService.getRooms({ page, limit });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch room listings.'
    });
  }
};

export const getRoomById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await communityService.getRoomById(req.params.id);
    return res.status(200).json({
      success: true,
      data: { post }
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

export const updateRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, price, location, contactNumber, images } = req.body;
    const post = await communityService.updateRoom(req.params.id, {
      title,
      description,
      price: price !== undefined ? parseFloat(price) : undefined,
      location,
      contactNumber,
      images
    });

    return res.status(200).json({
      success: true,
      message: 'Room listing updated successfully.',
      data: { post }
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await communityService.deleteRoom(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Room listing deleted successfully.'
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

// === Marketplace ===
export const createMarketplace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { title, description, price, contactNumber, images } = req.body;
    if (!title || !description || price === undefined || !contactNumber || !images) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, price, contactNumber, and images array are required.'
      });
    }

    const post = await communityService.createMarketplace(req.user._id, {
      title,
      description,
      price: parseFloat(price),
      contactNumber,
      images
    });

    return res.status(201).json({
      success: true,
      message: 'Marketplace post created successfully.',
      data: { post }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create marketplace post.'
    });
  }
};

export const getMarketplace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await communityService.getMarketplace({ page, limit });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch marketplace posts.'
    });
  }
};

export const getMarketplaceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await communityService.getMarketplaceById(req.params.id);
    return res.status(200).json({
      success: true,
      data: { post }
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

export const updateMarketplace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, price, contactNumber, images } = req.body;
    const post = await communityService.updateMarketplace(req.params.id, {
      title,
      description,
      price: price !== undefined ? parseFloat(price) : undefined,
      contactNumber,
      images
    });

    return res.status(200).json({
      success: true,
      message: 'Marketplace post updated successfully.',
      data: { post }
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteMarketplace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await communityService.deleteMarketplace(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Marketplace post deleted successfully.'
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};
