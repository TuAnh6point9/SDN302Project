import { Document, Model, Schema, Types, model } from "mongoose";

export type RewardReason = "daily_login" | "purchase" | "review" | "redeem_voucher";

export interface IRewardHistory extends Document {
  user: Types.ObjectId;
  points: number;
  day: string;
  reason: RewardReason;
  balanceAfter: number;
  refId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const rewardHistorySchema = new Schema<IRewardHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    points: { type: Number, required: true },
    day: { type: String, required: true },
    reason: {
      type: String,
      enum: ["daily_login", "purchase", "review", "redeem_voucher"],
      required: true
    },
    balanceAfter: { type: Number, required: true },
    refId: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

rewardHistorySchema.index({ user: 1, createdAt: -1 });
rewardHistorySchema.index({ reason: 1, refId: 1 }, { unique: true, partialFilterExpression: { refId: { $exists: true } } });

export const RewardHistory: Model<IRewardHistory> = model<IRewardHistory>(
  "RewardHistory",
  rewardHistorySchema
);
