import { Request, Response } from "express";
import { Voucher } from "../models/Voucher";
import { asyncHandler } from "../utils/asyncHandler";
import { calculateVoucherDiscount } from "../services/voucherService";

export const getVouchers = asyncHandler(async (_req: Request, res: Response) => {
  const vouchers = await Voucher.find().sort({ createdAt: -1 });
  res.json({ vouchers });
});

export const createVoucher = asyncHandler(async (req: Request, res: Response) => {
  const voucher = await Voucher.create({
    ...req.body,
    code: req.body.code.toUpperCase(),
    startsAt: req.body.startsAt ? new Date(req.body.startsAt) : undefined,
    expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
  });

  res.status(201).json({ voucher });
});

export const updateVoucher = asyncHandler(async (req: Request, res: Response) => {
  const voucher = await Voucher.findOneAndUpdate(
    { code: req.params.code.toUpperCase() },
    {
      ...req.body,
      code: req.body.code ? req.body.code.toUpperCase() : undefined,
      startsAt: req.body.startsAt ? new Date(req.body.startsAt) : undefined,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
    },
    { new: true, runValidators: true }
  );

  res.json({ voucher });
});

export const validateVoucher = asyncHandler(async (req: Request, res: Response) => {
  const subtotal = Number(req.query.subtotal ?? 0);
  const discount = await calculateVoucherDiscount(req.params.code, subtotal);

  res.json(discount);
});
