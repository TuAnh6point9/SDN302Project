import { Document, Model, Schema, Types, model } from "mongoose";

export interface ICartItem {
  _id: Types.ObjectId;
  book: Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: true }
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    items: { type: [cartItemSchema], default: [] }
  },
  { timestamps: true }
);

export const Cart: Model<ICart> = model<ICart>("Cart", cartSchema);
