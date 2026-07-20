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
    throw new ApiError(400, "Mã giảm giá không hợp lệ");
  }

  const now = new Date();
  if (voucher.startsAt && voucher.startsAt > now) {
    throw new ApiError(400, "Mã giảm giá chưa đến thời gian sử dụng");
  }

  if (voucher.expiresAt && voucher.expiresAt < now) {
    throw new ApiError(400, "Mã giảm giá đã hết hạn");
  }

  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    throw new ApiError(400, "Mã giảm giá đã hết lượt sử dụng");
  }

  if (subtotal < voucher.minOrderValue) {
    throw new ApiError(400, "Đơn hàng chưa đạt giá trị tối thiểu của voucher");
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
