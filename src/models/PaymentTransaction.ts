import { Document, Model, Schema, Types, model } from "mongoose";

export type PaymentProvider = "payos";
export type PaymentTransactionStatus = "PENDING" | "PAID" | "CANCELLED" | "FAILED";

export interface IPaymentTransaction extends Document {
  order: Types.ObjectId;
  provider: PaymentProvider;
  providerOrderCode: number;
  paymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  amount: number;
  description: string;
  status: PaymentTransactionStatus;
  reference?: string;
  paidAt?: Date;
  rawResponse?: unknown;
  rawWebhook?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    provider: { type: String, enum: ["payos"], required: true, default: "payos" },
    providerOrderCode: { type: Number, required: true, unique: true, index: true },
    paymentLinkId: { type: String, trim: true, index: true },
    checkoutUrl: { type: String, trim: true },
    qrCode: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED", "FAILED"],
      required: true,
      default: "PENDING",
      index: true
    },
    reference: { type: String, trim: true },
    paidAt: { type: Date },
    rawResponse: { type: Schema.Types.Mixed },
    rawWebhook: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ order: 1, provider: 1, status: 1 });

export const PaymentTransaction: Model<IPaymentTransaction> = model<IPaymentTransaction>(
  "PaymentTransaction",
  paymentTransactionSchema
);
