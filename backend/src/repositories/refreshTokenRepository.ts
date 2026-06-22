import { RefreshToken, IRefreshToken } from '../models/RefreshToken';
import mongoose from 'mongoose';

export const saveToken = async (
  userId: string | mongoose.Types.ObjectId,
  token: string,
  expiresAt: Date
): Promise<IRefreshToken> => {
  return RefreshToken.create({
    userId,
    token,
    expiresAt
  });
};

export const findToken = async (token: string): Promise<IRefreshToken | null> => {
  return RefreshToken.findOne({ token }).exec();
};

export const deleteToken = async (token: string): Promise<any> => {
  return RefreshToken.deleteOne({ token }).exec();
};

export const deleteAllUserTokens = async (
  userId: string | mongoose.Types.ObjectId
): Promise<any> => {
  return RefreshToken.deleteMany({ userId }).exec();
};
