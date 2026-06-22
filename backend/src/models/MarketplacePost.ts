import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketplacePost extends Document {
  title: string;
  description: string;
  price: number;
  images: string[];
  contactNumber: string;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplacePostSchema = new Schema<IMarketplacePost>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  images: { 
    type: [String], 
    required: true,
    validate: {
      validator: function(val: string[]) {
        return val.length >= 1 && val.length <= 5;
      },
      message: 'Marketplace post must have between 1 and 5 images.'
    }
  },
  contactNumber: { type: String, required: true, trim: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

MarketplacePostSchema.index({ ownerId: 1 });
MarketplacePostSchema.index({ createdAt: -1 });

export const MarketplacePost = mongoose.model<IMarketplacePost>('MarketplacePost', MarketplacePostSchema);
