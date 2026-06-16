import { Document, Model, Schema, Types, model } from "mongoose";

export interface IBook extends Document {
  title: string;
  slug: string;
  author: string;
  publisher?: string;
  description: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  images: string[];
  category: Types.ObjectId;
  tags: string[];
  isbn?: string;
  language: string;
  pages?: number;
  publishedYear?: number;
  ratingAverage: number;
  numReviews: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true, trim: true, maxlength: 220 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    author: { type: String, required: true, trim: true },
    publisher: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: {
      type: Number,
      min: 0,
      validate: {
        validator(this: IBook, value?: number) {
          return value === undefined || value <= this.price;
        },
        message: "Giá khuyến mãi không được lớn hơn giá gốc"
      }
    },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [String], default: [] },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true
    },
    tags: { type: [String], default: [] },
    isbn: { type: String, trim: true },
    language: { type: String, default: "vi", trim: true },
    pages: { type: Number, min: 1 },
    publishedYear: { type: Number, min: 0 },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Index phục vụ search nhanh theo tên sách, tác giả và tag.
bookSchema.index({ title: "text", author: "text", tags: "text" });

// Index phục vụ filter theo category và sort/filter theo giá.
bookSchema.index({ category: 1, price: 1 });
bookSchema.index({ isFeatured: 1, createdAt: -1 });

export const Book: Model<IBook> = model<IBook>("Book", bookSchema);
