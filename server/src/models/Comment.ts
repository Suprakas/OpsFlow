import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  requestId: string;
  authorId: string;
  authorName?: string;
  body: string;
  clientMutationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    requestId: { type: String, required: true, index: true },
    authorId: { type: String, required: true, index: true },
    authorName: { type: String },
    body: { type: String, required: true, maxlength: 5000 },
    clientMutationId: { type: String },
  },
  { timestamps: true }
);

CommentSchema.index({ requestId: 1, createdAt: 1, _id: 1 });
CommentSchema.index({ requestId: 1, authorId: 1, clientMutationId: 1 }, { unique: true, sparse: true });

export const CommentModel = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);