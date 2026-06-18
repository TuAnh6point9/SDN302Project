import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { Book } from "../models/Book";
import { IOrder, Order } from "../models/Order";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { createOrderWithStockTransaction } from "../services/orderService";
import { sendOrderCreatedEmail, sendOrderStatusEmail } from "../services/emailService";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await createOrderWithStockTransaction({
    userId: req.user!._id,
    items: req.body.items,
    shippingAddress: req.body.shippingAddress,
    shippingFee: req.body.shippingFee,
    voucherCode: req.body.voucherCode,
    paymentMethod: req.body.paymentMethod
  });

  await order.populate("user", "name email phone");
  sendOrderCreatedEmail(order).catch((error) => {
    console.error("Order email failed", error);
  });

  res.status(201).json({ order });
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ user: req.user!._id }).sort({ createdAt: -1 });
  res.json({ orders });
});

export const getAllOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const filter: FilterQuery<IOrder> = {};
    const { search, orderStatus, paymentStatus, paymentMethod, dateFrom, dateTo } = req.query;

    if (orderStatus && orderStatus !== "all") {
      filter.orderStatus = orderStatus;
    }

    if (paymentStatus && paymentStatus !== "all") {
      filter.paymentStatus = paymentStatus;
    }

    if (paymentMethod && paymentMethod !== "all") {
      filter.paymentMethod = paymentMethod;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(String(dateFrom));
      }
      if (dateTo) {
        const endDate = new Date(String(dateTo));
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    if (search) {
      const keyword = String(search).trim();
      filter.$or = [
        { orderCode: { $regex: keyword, $options: "i" } },
        { "shippingAddress.recipientName": { $regex: keyword, $options: "i" } },
        { "shippingAddress.phone": { $regex: keyword, $options: "i" } }
      ];
    }

    const orders = await Order.find(filter)
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
    await order.populate("user", "name email phone");
    sendOrderStatusEmail(order).catch((error) => {
      console.error("Order status email failed", error);
    });
    res.json({ order });
  }
);
