import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityItem extends Document {
  requestId: string;
  sourceEventId: string;
  type: string;
  summary: string;
  actorId?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivityItemSchema: Schema = new Schema(
  {
    requestId: { type: String, required: true, index: true },
    sourceEventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    summary: { type: String, required: true },
    actorId: { type: String },
    actorName: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityItemSchema.index({ requestId: 1, createdAt: -1, _id: 1 });

export const ActivityItemModel =
  mongoose.models.ActivityItem || mongoose.model<IActivityItem>('ActivityItem', ActivityItemSchema);