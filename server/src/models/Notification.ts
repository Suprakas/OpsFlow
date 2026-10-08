import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: string;
  sourceEventId: string;
  type: string;
  requestId?: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipientId: { type: String, required: true, index: true },
    sourceEventId: { type: String, required: true },
    type: { type: String, required: true },
    requestId: { type: String },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, sourceEventId: 1, type: 1 }, { unique: true });
NotificationSchema.index({ recipientId: 1, createdAt: -1, _id: 1 });

export const NotificationModel =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);