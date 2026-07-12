import crypto from "crypto";
import mongoose, { Types } from "mongoose";
import { IOrder, Order } from "../models/Order";
import { RewardHistory } from "../models/RewardHistory";
import { User } from "../models/User";
import { Voucher } from "../models/Voucher";
import { ApiError } from "../utils/ApiError";
import { createNotification } from "./notificationService";

export const DAILY_REWARD_POINTS = 10;
export const REVIEW_REWARD_POINTS = 5;
export const VND_PER_POINT = 10000; // 1 điểm mỗi 10.000đ giá trị đơn hàng
export const POINTS_TO_VND_RATE = 100; // 1 điểm quy đổi = 100đ giá trị voucher
export const REDEEM_MIN_POINTS = 100;
export const REDEEM_STEP = 100;

// Ngày theo giờ Việt Nam (UTC+7), dạng "YYYY-MM-DD"
export const vnDay = (d: Date = new Date()): string =>
  new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);

export const claimDailyReward = async (userId: Types.ObjectId | string) => {
  const today = vnDay();

  const user = await User.findOneAndUpdate(
    { _id: userId, lastRewardDay: { $ne: today } },
    { $inc: { points: DAILY_REWARD_POINTS }, $set: { lastRewardDay: today } },
    { new: true }
  );

  if (!user) {
    throw new ApiError(409, "Hôm nay bạn đã nhận điểm thưởng rồi");
  }

  try {
    await RewardHistory.create({
      user: user._id,
      points: DAILY_REWARD_POINTS,
      day: today,
      reason: "daily_login",
      balanceAfter: user.points
    });
  } catch (error) {
    // Điểm đã cộng thành công — chỉ mất log row, không fail request
    console.error("Failed to write reward history:", error);
  }

  createNotification({
    user: user._id as Types.ObjectId,
    audience: "user",
    type: "system",
    title: "Điểm danh hàng ngày",
    message: `Bạn đã nhận ${DAILY_REWARD_POINTS} điểm thưởng.`,
    link: "/rewards"
  }).catch(console.error);

  return user;
};

// Cộng điểm cho một mốc gắn với 1 document nguồn (order/review), idempotent nhờ
// unique index { reason, refId } trên RewardHistory — insert trùng sẽ bị chặn ở DB.
const grantRewardForRef = async (
  userId: Types.ObjectId | string,
  points: number,
  reason: "purchase" | "review",
  refId: Types.ObjectId
) => {
  const user = await User.findByIdAndUpdate(userId, { $inc: { points } }, { new: true });
  if (!user) return null;

  try {
    await RewardHistory.create({
      user: user._id,
      points,
      day: vnDay(),
      reason,
      balanceAfter: user.points,
      refId
    });
  } catch (error) {
    const isDuplicate = (error as { code?: number }).code === 11000;
    if (isDuplicate) {
      // Đã cộng thưởng cho ref này trước đó — hoàn tác điểm vừa cộng nhầm.
      await User.findByIdAndUpdate(userId, { $inc: { points: -points } });
      return null;
    }
    console.error("Failed to write reward history:", error);
  }

  return user;
};

export const awardPurchaseReward = async (order: IOrder) => {
  const points = Math.floor(order.total / VND_PER_POINT);
  if (points <= 0) return null;

  // Order.rewardGranted là guard atomic chống thưởng 2 lần cho cùng đơn hàng.
  const flaggedOrder = await Order.findOneAndUpdate(
    { _id: order._id, rewardGranted: { $ne: true } },
    { $set: { rewardGranted: true } },
    { new: true }
  );
  if (!flaggedOrder) return null;

  const user = await grantRewardForRef(order.user, points, "purchase", order._id as Types.ObjectId);
  if (!user) return null;

  createNotification({
    user: user._id as Types.ObjectId,
    audience: "user",
    type: "system",
    title: "Thưởng mua hàng",
    message: `Bạn đã nhận ${points} điểm thưởng từ đơn hàng ${order.orderCode}.`,
    link: "/rewards"
  }).catch(console.error);

  return user;
};

export const awardReviewReward = async (userId: Types.ObjectId | string, reviewId: Types.ObjectId) => {
  const user = await grantRewardForRef(userId, REVIEW_REWARD_POINTS, "review", reviewId);
  if (!user) return null;

  createNotification({
    user: user._id as Types.ObjectId,
    audience: "user",
    type: "system",
    title: "Thưởng đánh giá",
    message: `Bạn đã nhận ${REVIEW_REWARD_POINTS} điểm thưởng nhờ đánh giá sách.`,
    link: "/rewards"
  }).catch(console.error);

  return user;
};

export const redeemPointsForVoucher = async (userId: Types.ObjectId | string, points: number) => {
  if (points < REDEEM_MIN_POINTS || points % REDEEM_STEP !== 0) {
    throw new ApiError(400, `Điểm quy đổi phải là bội số của ${REDEEM_STEP} và tối thiểu ${REDEEM_MIN_POINTS} điểm`);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findOneAndUpdate(
      { _id: userId, points: { $gte: points } },
      { $inc: { points: -points } },
      { new: true, session }
    );

    if (!user) {
      throw new ApiError(400, "Số điểm hiện có không đủ để quy đổi");
    }

    const code = `RWD${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const value = points * POINTS_TO_VND_RATE;

    const [voucher] = await Voucher.create(
      [
        {
          code,
          type: "fixed",
          value,
          minOrderValue: 0,
          usageLimit: 1,
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000)
        }
      ],
      { session }
    );

    await RewardHistory.create(
      [
        {
          user: user._id,
          points: -points,
          day: vnDay(),
          reason: "redeem_voucher",
          balanceAfter: user.points,
          refId: voucher._id
        }
      ],
      { session }
    );

    await session.commitTransaction();

    createNotification({
      user: user._id as Types.ObjectId,
      audience: "user",
      type: "system",
      title: "Đổi điểm thành công",
      message: `Bạn đã đổi ${points} điểm lấy voucher ${code} trị giá ${value.toLocaleString("vi-VN")}đ.`,
      link: "/rewards"
    }).catch(console.error);

    return { user, voucher };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const getRewardHistory = async (
  userId: Types.ObjectId | string,
  limit = 50
) => RewardHistory.find({ user: userId }).sort({ createdAt: -1 }).limit(limit);
