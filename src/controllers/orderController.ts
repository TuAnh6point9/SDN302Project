import { Request, Response } from "express";
import { Order } from "../models/Order";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { createOrderWithStockTransaction } from "../services/orderService";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.paymentMethod && req.body.paymentMethod !== "COD") {
    throw new ApiError(400, "Hệ thống chỉ hỗ trợ thanh toán COD");
  }

  const order = await createOrderWithStockTransaction({
    userId: req.user!._id,
    items: req.body.items,
    shippingAddress: req.body.shippingAddress,
    shippingFee: req.body.shippingFee
  });

  res.status(201).json({ order });
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ user: req.user!._id }).sort({ createdAt: -1 });
  res.json({ orders });
});

export const getAllOrders = asyncHandler(
  async (_req: Request, res: Response) => {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ orders });
  }
);

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email phone"
  );

  if (!order) {
    throw new ApiError(404, "Không tìm thấy đơn hàng");
  }

  if (req.user!.role !== "admin" && String(order.user._id) !== String(req.user!._id)) {
    throw new ApiError(403, "Bạn không có quyền xem đơn hàng này");
  }

  res.json({ order });
});

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        orderStatus: req.body.orderStatus,
        ...(req.body.paymentStatus ? { paymentStatus: req.body.paymentStatus } : {})
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      throw new ApiError(404, "Không tìm thấy đơn hàng");
    }

    res.json({ order });
  }
);
