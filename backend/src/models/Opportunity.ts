import mongoose, { Schema, Document } from 'mongoose';

export interface IOpportunity extends Document {
  title: string;
  description: string;
  type: 'internship' | 'job' | 'workshop' | 'mentorship' | 'hackathon';
  link: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OpportunitySchema = new Schema<IOpportunity>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    enum: ['internship', 'job', 'workshop', 'mentorship', 'hackathon'], 
    required: true 
  },
  link: { 
    type: String, 
    required: true,
    trim: true,
    validate: {
      validator: function(val: string) {
        // Enforce http/https protocols and block javascript/data/file URI schemas
        return /^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(val);
      },
      message: 'Opportunity link must be a valid absolute HTTP or HTTPS URL.'
    }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

OpportunitySchema.index({ type: 1 });
OpportunitySchema.index({ createdBy: 1 });
OpportunitySchema.index({ createdAt: -1 });

export const Opportunity = mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);
