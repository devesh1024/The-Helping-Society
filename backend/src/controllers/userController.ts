import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { UpdateProfileSchema } from '../validators/userValidator';

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const validatedData = UpdateProfileSchema.parse(req.body);
    const updatedUser = await userService.updateProfile(req.user._id, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updatedUser }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation Failed',
        errors: error.errors
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update profile.'
    });
  }
};
