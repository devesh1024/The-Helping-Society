import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reportedBy: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId; // ID of the user, resource, opportunity, or post being reported
  targetType: 'resource' | 'user' | 'post' | 'opportunity';
  reason: string;
  status: 'pending' | 'resolved';
  resolvedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  targetType: { 
    type: String, 
    enum: ['resource', 'user', 'post', 'opportunity'], 
    required: true 
  },
  reason: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['pending', 'resolved'], 
    default: 'pending' 
  },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

ReportSchema.index({ status: 1 });
ReportSchema.index({ targetType: 1, targetId: 1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
