import { Document, Model, Schema, Types, model } from "mongoose";

export type RewardReason = "daily_login" | "purchase" | "review" | "redeem_voucher" | "claimed_voucher";

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
      enum: ["daily_login", "purchase", "review", "redeem_voucher", "claimed_voucher"],
      required: true
    },
    balanceAfter: { type: Number, required: true },
    refId: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

rewardHistorySchema.index({ user: 1, createdAt: -1 });
// user nằm trong key: purchase/review vốn đã 1 user - 1 refId nên không đổi hành vi cũ;
// bắt buộc cho claimed_voucher vì 1 mã voucher công khai có thể được nhiều user khác nhau nhận.
rewardHistorySchema.index({ user: 1, reason: 1, refId: 1 }, { unique: true, partialFilterExpression: { refId: { $exists: true } } });

export const RewardHistory: Model<IRewardHistory> = model<IRewardHistory>(
  "RewardHistory",
  rewardHistorySchema
);
