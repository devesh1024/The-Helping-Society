import mongoose, { Schema, Document } from 'mongoose';

export interface IOpportunityArchive extends Document {
  originalOpportunity: any;
  companyName: string;
  jobTitle: string;
  opportunityType: string;
  deadline?: Date;
  description: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploaderName: string;
  uploaderRole: string;
  uploadedAt: Date;
  deletedAt: Date;
  deletionReason: 'manual_user' | 'manual_admin' | 'auto_expired';
}

const OpportunityArchiveSchema = new Schema<IOpportunityArchive>({
  originalOpportunity: { type: Schema.Types.Mixed, required: true },
  companyName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  opportunityType: { type: String, required: true },
  deadline: { type: Date },
  description: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploaderName: { type: String, required: true },
  uploaderRole: { type: String, required: true },
  uploadedAt: { type: Date, required: true },
  deletedAt: { type: Date, required: true, default: Date.now },
  deletionReason: { 
    type: String, 
    enum: ['manual_user', 'manual_admin', 'auto_expired'], 
    required: true 
  }
}, { collection: 'opportunityarchives', timestamps: false });

export const OpportunityArchive = mongoose.model<IOpportunityArchive>('OpportunityArchive', OpportunityArchiveSchema);
