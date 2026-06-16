import { Document, Model, Schema, Types, model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parent?: Types.ObjectId | null;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: { type: String, trim: true },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    image: { type: String, trim: true }
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1, slug: 1 });

export const Category: Model<ICategory> = model<ICategory>(
  "Category",
  categorySchema
);
