import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  action: 'approval' | 'rejection' | 'roleChange' | 'ban' | 'resourceAction';
  targetId?: mongoose.Types.ObjectId | null;
  details?: string | null;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    enum: ['approval', 'rejection', 'roleChange', 'ban', 'resourceAction'], 
    required: true 
  },
  targetId: { type: Schema.Types.ObjectId, default: null },
  details: { type: String, trim: true, default: null },
  createdAt: { type: Date, default: Date.now, required: true }
});

// TTL index to automatically delete audit logs after 7 days (604800 seconds)
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
