import mongoose, { Schema, Document } from 'mongoose';

export interface IResourceRequest extends Document {
  title: string;
  description: string;
  category: 'notes' | 'pyqs' | 'books' | 'syllabus' | 'study_material';
  file: {
    publicId: string;
    secureUrl: string;
    fileType: string;
    fileSize: number; // in bytes
  };
  uploadedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ResourceRequestSchema = new Schema<IResourceRequest>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ['notes', 'pyqs', 'books', 'syllabus', 'study_material'], 
    required: true 
  },
  file: {
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { 
      type: Number, 
      required: true,
      max: [50 * 1024 * 1024, 'File size cannot exceed 50MB']
    }
  },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }
}, { timestamps: true });

ResourceRequestSchema.index({ status: 1 });
ResourceRequestSchema.index({ uploadedBy: 1 });

export const ResourceRequest = mongoose.model<IResourceRequest>('ResourceRequest', ResourceRequestSchema);
