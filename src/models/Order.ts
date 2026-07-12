import { Document, Model, Schema, Types, model } from "mongoose";

export type PaymentMethod = "COD" | "ONLINE";
export type PaymentStatus = "pending" | "paid" | "failed";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "cancelled";

export interface IOrderStatusHistory {
  status: OrderStatus;
  note?: string;
  changedBy?: Types.ObjectId;
  changedAt: Date;
}

export interface IOrderItem {
  book: Types.ObjectId;
  title: string;
  price: number;
  quantity: number;
}

export interface IShippingAddress {
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
}

export interface IOrder extends Document {
  orderCode: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discountTotal: number;
  voucherCode?: string;
  shippingFee: number;
  total: number;
  shippingAddress: IShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  cancelReason?: string;
  statusHistory: IOrderStatusHistory[];
  rewardGranted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const orderStatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
      required: true
    },
    note: { type: String, trim: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now, required: true }
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderCode: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, required: true, min: 0, default: 0 },
    voucherCode: { type: String, trim: true, uppercase: true },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ["COD", "ONLINE"], default: "COD", required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
      default: "pending",
      index: true
    },
    cancelReason: { type: String, trim: true },
    statusHistory: { type: [orderStatusHistorySchema], default: [] },
    rewardGranted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Order: Model<IOrder> = model<IOrder>("Order", orderSchema);
