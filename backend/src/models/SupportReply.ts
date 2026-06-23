import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportReply extends Document {
  supportRequestId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportReplySchema = new Schema<ISupportReply>({
  supportRequestId: { type: Schema.Types.ObjectId, ref: 'SupportRequest', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    validate: {
      validator: function(val: string) {
        // Reject HTML tags in replies
        return !/<[^>]*>/g.test(val);
      },
      message: 'HTML tags are prohibited in support replies.'
    }
  }
}, { timestamps: true });

SupportReplySchema.index({ supportRequestId: 1 });
SupportReplySchema.index({ authorId: 1 });
SupportReplySchema.index({ createdAt: 1 });

export const SupportReply = mongoose.model<ISupportReply>('SupportReply', SupportReplySchema);
