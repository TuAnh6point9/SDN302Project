import { Router } from "express";
import {
  createVoucher,
  getHomepageEventVoucher,
  getVouchers,
  updateVoucher,
  validateVoucher
} from "../controllers/voucherController";
import { protect, requireAdmin } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createVoucherSchema,
  updateVoucherSchema,
  validateVoucherSchema
} from "../validations/schemas";

const router = Router();

router.get("/homepage-event", getHomepageEventVoucher);
router.get("/validate/:code", protect, validate(validateVoucherSchema), validateVoucher);
router.get("/", protect, requireAdmin, getVouchers);
router.post("/", protect, requireAdmin, validate(createVoucherSchema), createVoucher);
router.put("/:code", protect, requireAdmin, validate(updateVoucherSchema), updateVoucher);

export default router;
