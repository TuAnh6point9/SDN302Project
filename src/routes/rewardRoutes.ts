import { Router } from "express";
import {
  claimReward,
  getAllRewardHistory,
  getRewardHistory,
  getRewardStatus,
  getRewardSummary,
  redeemVoucher
} from "../controllers/rewardController";
import { protect, requireAdmin } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { redeemVoucherSchema, rewardHistorySchema } from "../validations/schemas";

const router = Router();

router.use(protect);
router.get("/status", getRewardStatus);
router.post("/claim", claimReward);
router.post("/redeem", validate(redeemVoucherSchema), redeemVoucher);
router.get("/history", validate(rewardHistorySchema), getRewardHistory);
router.get("/admin/summary", requireAdmin, getRewardSummary);
router.get("/admin/history", requireAdmin, validate(rewardHistorySchema), getAllRewardHistory);

export default router;
