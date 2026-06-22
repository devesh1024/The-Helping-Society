import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportRequest extends Document {
  title: string;
  description: string;
  contactNumber: string;
  location: string;
  images: string[];
  isEmergency: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'resolved';
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupportRequestSchema = new Schema<ISupportRequest>({
  title: { type: String, required: true, trim: true },
  description: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  contactNumber: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  images: { type: [String], default: [] },
  isEmergency: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'resolved'], 
    default: 'pending' 
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Pre-save hook to ensure emergency requests bypass pending state and go live immediately
SupportRequestSchema.pre<ISupportRequest>('save', function(next) {
  if (this.isEmergency && this.status === 'pending') {
    this.status = 'approved';
  }
  next();
});

SupportRequestSchema.index({ status: 1 });
SupportRequestSchema.index({ isEmergency: 1 });
SupportRequestSchema.index({ ownerId: 1 });
SupportRequestSchema.index({ createdAt: -1 });

export const SupportRequest = mongoose.model<ISupportRequest>('SupportRequest', SupportRequestSchema);
