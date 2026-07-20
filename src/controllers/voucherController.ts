import { Request, Response } from "express";
import { Voucher } from "../models/Voucher";
import { asyncHandler } from "../utils/asyncHandler";
import { calculateVoucherDiscount } from "../services/voucherService";

export const getVouchers = asyncHandler(async (_req: Request, res: Response) => {
  const vouchers = await Voucher.find().sort({ createdAt: -1 });
  res.json({ vouchers });
});

export const createVoucher = asyncHandler(async (req: Request, res: Response) => {
  // Chỉ 1 voucher được làm banner trang chủ tại 1 thời điểm — tắt voucher đang bật trước đó.
  if (req.body.isHomepageEvent) {
    await Voucher.updateMany({ isHomepageEvent: true }, { isHomepageEvent: false });
  }

  const voucher = await Voucher.create({
    ...req.body,
    code: req.body.code.toUpperCase(),
    startsAt: req.body.startsAt ? new Date(req.body.startsAt) : undefined,
    expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
  });

  res.status(201).json({ voucher });
});

export const updateVoucher = asyncHandler(async (req: Request, res: Response) => {
  // Chỉ 1 voucher được làm banner trang chủ tại 1 thời điểm — tắt voucher đang bật trước đó.
  if (req.body.isHomepageEvent) {
    await Voucher.updateMany({ isHomepageEvent: true }, { isHomepageEvent: false });
  }

  const update: Record<string, unknown> = { ...req.body };

  if (req.body.code) {
    update.code = req.body.code.toUpperCase();
  } else {
    delete update.code;
  }

  if (req.body.startsAt) {
    update.startsAt = new Date(req.body.startsAt);
  }

  if (req.body.expiresAt) {
    update.expiresAt = new Date(req.body.expiresAt);
  }

  const voucher = await Voucher.findOneAndUpdate(
    { code: req.params.code.toUpperCase() },
    update,
    { new: true, runValidators: true }
  );

  res.json({ voucher });
});

export const validateVoucher = asyncHandler(async (req: Request, res: Response) => {
  const subtotal = Number(req.query.subtotal ?? 0);
  const discount = await calculateVoucherDiscount(req.params.code, subtotal);

  res.json(discount);
});

export const getHomepageEventVoucher = asyncHandler(async (_req: Request, res: Response) => {
  const voucher = await Voucher.findOne({ isHomepageEvent: true, isActive: true });
  res.json({ voucher });
});
