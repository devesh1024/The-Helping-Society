import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  ownerId: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  targetType: 'resource' | 'lostFound' | 'room' | 'marketplace';
  parentId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  content: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: [1000, 'Comment content cannot exceed 1000 characters'],
    validate: {
      validator: function(val: string) {
        // Enforce plain text: reject any string that looks like HTML tags
        return !/<[^>]*>/g.test(val);
      },
      message: 'HTML tags are prohibited in comments.'
    }
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  targetType: { 
    type: String, 
    enum: ['resource', 'lostFound', 'room', 'marketplace'], 
    required: true 
  },
  parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null }
}, { timestamps: true });

// Pre-save hook to enforce maximum comment reply nesting depth of 1 level
CommentSchema.pre<IComment>('save', async function(next) {
  if (this.parentId) {
    const ParentComment = mongoose.model<IComment>('Comment');
    const parent = await ParentComment.findById(this.parentId);
    if (!parent) {
      return next(new Error('Parent comment does not exist.'));
    }
    // If the parent comment itself has a parentId, it is already a reply, so we reject nesting deeper
    if (parent.parentId) {
      return next(new Error('Nesting depth limit exceeded: Replies are limited to 1 level.'));
    }
  }
  next();
});

CommentSchema.index({ targetId: 1, targetType: 1 });
CommentSchema.index({ parentId: 1 });
CommentSchema.index({ ownerId: 1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
