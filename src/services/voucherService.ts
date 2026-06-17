import { ClientSession } from "mongoose";
import { Voucher } from "../models/Voucher";
import { ApiError } from "../utils/ApiError";

export const calculateVoucherDiscount = async (
  code: string | undefined,
  subtotal: number,
  session?: ClientSession
) => {
  if (!code) {
    return { discountTotal: 0, voucherCode: undefined };
  }

  const normalizedCode = code.trim().toUpperCase();
  const voucherQuery = Voucher.findOne({ code: normalizedCode });
  if (session) {
    voucherQuery.session(session);
  }
  const voucher = await voucherQuery;

  if (!voucher || !voucher.isActive) {
    throw new ApiError(400, "Ma giam gia khong hop le");
  }

  const now = new Date();
  if (voucher.startsAt && voucher.startsAt > now) {
    throw new ApiError(400, "Ma giam gia chua den thoi gian su dung");
  }

  if (voucher.expiresAt && voucher.expiresAt < now) {
    throw new ApiError(400, "Ma giam gia da het han");
  }

  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    throw new ApiError(400, "Ma giam gia da het luot su dung");
  }

  if (subtotal < voucher.minOrderValue) {
    throw new ApiError(400, "Don hang chua dat gia tri toi thieu cua voucher");
  }

  const rawDiscount = voucher.type === "percent"
    ? Math.floor((subtotal * voucher.value) / 100)
    : voucher.value;

  const cappedDiscount = voucher.maxDiscount
    ? Math.min(rawDiscount, voucher.maxDiscount)
    : rawDiscount;

  return {
    discountTotal: Math.min(cappedDiscount, subtotal),
    voucherCode: voucher.code
  };
};
