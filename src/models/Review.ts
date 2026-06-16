import { Document, Model, Schema, Types, model } from "mongoose";

export interface IReview extends Document {
  user: Types.ObjectId;
  book: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

// Mỗi user chỉ được review một lần cho mỗi sách.
reviewSchema.index({ user: 1, book: 1 }, { unique: true });
reviewSchema.index({ book: 1, createdAt: -1 });

export const Review: Model<IReview> = model<IReview>("Review", reviewSchema);
