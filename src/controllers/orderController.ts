import { Request, Response } from "express";
import { Book } from "../models/Book";
import { Order } from "../models/Order";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { createOrderWithStockTransaction } from "../services/orderService";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await createOrderWithStockTransaction({
    userId: req.user!._id,
    items: req.body.items,
    shippingAddress: req.body.shippingAddress,
    shippingFee: req.body.shippingFee,
    voucherCode: req.body.voucherCode,
    paymentMethod: req.body.paymentMethod
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
    throw new ApiError(404, "Khong tim thay don hang");
  }

  if (req.user!.role !== "admin" && String(order.user._id) !== String(req.user!._id)) {
    throw new ApiError(403, "Ban khong co quyen xem don hang nay");
  }

  res.json({ order });
});

export const payOnlineDemo = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, "Khong tim thay don hang");
  }

  if (String(order.user) !== String(req.user!._id)) {
    throw new ApiError(403, "Ban khong co quyen thanh toan don hang nay");
  }

  if (order.paymentMethod !== "ONLINE") {
    throw new ApiError(400, "Don hang khong su dung thanh toan online");
  }

  if (order.orderStatus === "cancelled") {
    throw new ApiError(400, "Khong the thanh toan don hang da huy");
  }

  if (order.paymentStatus === "paid") {
    res.json({ order });
    return;
  }

  order.paymentStatus = "paid";
  order.statusHistory.push({
    status: order.orderStatus,
    note: "Thanh toan online demo thanh cong",
    changedBy: req.user!._id,
    changedAt: new Date()
  });

  await order.save();
  res.json({ order });
});

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new ApiError(404, "Khong tim thay don hang");
    }

    if (order.orderStatus === "cancelled" && req.body.orderStatus !== "cancelled") {
      throw new ApiError(400, "Khong the khoi phuc don hang da huy");
    }

    if (order.orderStatus !== "cancelled" && req.body.orderStatus === "cancelled") {
      await Promise.all(
        order.items.map((item) =>
          Book.updateOne(
            { _id: item.book },
            { $inc: { stockQuantity: item.quantity } }
          )
        )
      );
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = req.body.orderStatus;
    if (req.body.orderStatus === "cancelled") {
      order.cancelReason = req.body.cancelReason || req.body.note;
    }
    if (req.body.paymentStatus) {
      order.paymentStatus = req.body.paymentStatus;
    }

    if (previousStatus !== req.body.orderStatus) {
      order.statusHistory.push({
        status: req.body.orderStatus,
        note: req.body.note || req.body.cancelReason,
        changedBy: req.user!._id,
        changedAt: new Date()
      });
    }

    await order.save();
    res.json({ order });
  }
);
