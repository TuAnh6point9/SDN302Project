import { Request, Response } from "express";
import { Types } from "mongoose";
import { RewardHistory } from "../models/RewardHistory";
import { User } from "../models/User";
import {
  DAILY_REWARD_POINTS,
  claimDailyReward,
  claimVoucherByCode,
  getRewardHistory as getRewardHistoryService,
  redeemPointsForVoucher,
  vnDay
} from "../services/rewardService";
import { asyncHandler } from "../utils/asyncHandler";

export const getRewardStatus = asyncHandler(async (req: Request, res: Response) => {
  const today = vnDay();

  res.json({
    canClaim: req.user!.lastRewardDay !== today,
    points: req.user!.points ?? 0,
    rewardPoints: DAILY_REWARD_POINTS,
    today
  });
});

export const claimReward = asyncHandler(async (req: Request, res: Response) => {
  const user = await claimDailyReward(req.user!._id as Types.ObjectId);

  res.json({
    message: "Nhận thưởng thành công",
    user: user.toJSON(),
    rewardPoints: DAILY_REWARD_POINTS
  });
});

export const getRewardHistory = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const history = await getRewardHistoryService(req.user!._id as Types.ObjectId, limit);

  res.json({ history });
});

export const redeemVoucher = asyncHandler(async (req: Request, res: Response) => {
  const { user, voucher } = await redeemPointsForVoucher(req.user!._id as Types.ObjectId, req.body.points);

  res.json({
    message: "Đổi điểm thành voucher thành công",
    user: user.toJSON(),
    voucher
  });
});

export const claimVoucher = asyncHandler(async (req: Request, res: Response) => {
  const voucher = await claimVoucherByCode(
    req.user!._id as Types.ObjectId,
    req.body.code,
    req.user!.points ?? 0
  );

  res.json({ message: "Nhận voucher thành công", voucher });
});

export const getRewardSummary = asyncHandler(async (_req: Request, res: Response) => {
  const byReason = await RewardHistory.aggregate([
    {
      $group: {
        _id: "$reason",
        totalPoints: { $sum: "$points" },
        count: { $sum: 1 }
      }
    }
  ]);

  const totalIssued = byReason.reduce((sum, r) => sum + (r.totalPoints > 0 ? r.totalPoints : 0), 0);
  const totalRedeemed = byReason.reduce((sum, r) => sum + (r.totalPoints < 0 ? -r.totalPoints : 0), 0);

  const topHolders = await User.find({ points: { $gt: 0 } })
    .sort({ points: -1 })
    .limit(5)
    .select("name email points");

  res.json({
    totalIssued,
    totalRedeemed,
    byReason: byReason.map((r) => ({ reason: r._id, totalPoints: r.totalPoints, count: r.count })),
    topHolders
  });
});

export const getAllRewardHistory = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const history = await RewardHistory.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ history });
});
