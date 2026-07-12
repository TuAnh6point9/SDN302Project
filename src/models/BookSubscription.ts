import { Document, Model, Schema, Types, model } from "mongoose";

export interface IBookSubscription extends Document {
  user: Types.ObjectId;
  book: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bookSubscriptionSchema = new Schema<IBookSubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true }
  },
  { timestamps: true }
);

// Mỗi user chỉ được subscribe một lần cho mỗi sách.
bookSubscriptionSchema.index({ user: 1, book: 1 }, { unique: true });

export const BookSubscription: Model<IBookSubscription> = model<IBookSubscription>(
  "BookSubscription",
  bookSubscriptionSchema
);
