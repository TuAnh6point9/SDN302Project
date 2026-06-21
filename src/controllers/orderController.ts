import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { Book } from "../models/Book";
import { IOrder, Order } from "../models/Order";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { createOrderWithStockTransaction } from "../services/orderService";
import { sendOrderCreatedEmail, sendOrderStatusEmail } from "../services/emailService";
import { createNotification, notifyAdmins } from "../services/notificationService";
import { InventoryMovement } from "../models/InventoryMovement";

const restoreCancelledOrderStock = async (order: IOrder, changedBy: unknown) => {
  await Promise.all(
    order.items.map(async (item) => {
      const book = await Book.findOneAndUpdate(
        { _id: item.book },
        { $inc: { stockQuantity: item.quantity } },
        { new: true }
      );

      if (!book) {
        return;
      }

      await InventoryMovement.create({
        book: item.book,
        type: "return",
        quantityChange: item.quantity,
        quantityBefore: book.stockQuantity - item.quantity,
        quantityAfter: book.stockQuantity,
        note: `Cancelled order ${order.orderCode}`,
        createdBy: changedBy
      });
    })
  );
};

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
  createNotification({
    user: req.user!._id,
    audience: "user",
    type: "order",
    title: "Đơn hàng đã được tạo",
    message: `Đơn ${order.orderCode} đã được ghi nhận.`,
    link: `/orders/${order._id}`
  }).catch(console.error);
  notifyAdmins(
    "order",
    "Có đơn hàng mới",
    `Đơn ${order.orderCode} cần được xử lý.`,
    "/admin/orders"
  ).catch(console.error);

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

export const cancelMyOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, "Khong tim thay don hang");
  }

  if (String(order.user) !== String(req.user!._id)) {
    throw new ApiError(403, "Ban khong co quyen huy don hang nay");
  }

  if (order.orderStatus !== "pending") {
    throw new ApiError(400, "Chi co the huy don hang dang cho xac nhan");
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "Don hang da thanh toan, vui long lien he quan tri vien de duoc ho tro");
  }

  await restoreCancelledOrderStock(order, req.user!._id);

  const cancelReason = req.body.cancelReason?.trim() || "Khach hang huy don";
  order.orderStatus = "cancelled";
  order.cancelReason = cancelReason;
  order.statusHistory.push({
    status: "cancelled",
    note: cancelReason,
    changedBy: req.user!._id,
    changedAt: new Date()
  });

  await order.save();
  await order.populate("user", "name email phone");

  sendOrderStatusEmail(order).catch((error) => {
    console.error("Order cancellation email failed", error);
  });
  createNotification({
    user: req.user!._id,
    audience: "user",
    type: "order",
    title: "Don hang da duoc huy",
    message: `Don ${order.orderCode} da duoc huy.`,
    link: `/orders/${order._id}`
  }).catch(console.error);
  notifyAdmins(
    "order",
    "Khach hang huy don",
    `Don ${order.orderCode} da duoc khach hang huy.`,
    "/admin/orders"
  ).catch(console.error);

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
      await restoreCancelledOrderStock(order, req.user!._id);
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
    createNotification({
      user: order.user._id,
      audience: "user",
      type: "order",
      title: "Đơn hàng đã được cập nhật",
      message: `Đơn ${order.orderCode} hiện ở trạng thái ${order.orderStatus}.`,
      link: `/orders/${order._id}`
    }).catch(console.error);
    res.json({ order });
  }
);
