import { Document, Model, Schema, model } from "mongoose";

export type VoucherType = "percent" | "fixed";

export interface IVoucher extends Document {
  code: string;
  type: VoucherType;
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  startsAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  isHomepageEvent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const voucherSchema = new Schema<IVoucher>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    isHomepageEvent: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export const Voucher: Model<IVoucher> = model<IVoucher>("Voucher", voucherSchema);
