import crypto from "crypto";
import { Types } from "mongoose";
import { env } from "../config/env";
import { Order } from "../models/Order";
import { PaymentTransaction } from "../models/PaymentTransaction";
import { ApiError } from "../utils/ApiError";
import { sendPaymentSuccessEmail } from "./emailService";
import { createNotification, notifyAdmins } from "./notificationService";

interface PayosCreateResponse {
  code: string;
  desc: string;
  data?: {
    orderCode: number;
    amount: number;
    description: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
  };
  signature?: string;
}

interface PayosWebhookBody {
  code: string;
  desc: string;
  success: boolean;
  data: Record<string, unknown> & {
    orderCode?: number;
    amount?: number;
    paymentLinkId?: string;
    reference?: string;
    transactionDateTime?: string;
    code?: string;
    desc?: string;
  };
  signature: string;
}

const assertPayosConfig = () => {
  if (!env.payosClientId || !env.payosApiKey || !env.payosChecksumKey) {
    throw new ApiError(500, "Chua cau hinh PAYOS_CLIENT_ID, PAYOS_API_KEY hoac PAYOS_CHECKSUM_KEY");
  }
};

const sign = (data: string) =>
  crypto.createHmac("sha256", env.payosChecksumKey as string).update(data).digest("hex");

const sortObjectByKey = (value: Record<string, unknown>) =>
  Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = value[key];
      return result;
    }, {});

const valueToSignatureString = (value: unknown) => {
  if (value === null || value === undefined || value === "null" || value === "undefined") {
    return "";
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => (
      item && typeof item === "object" && !Array.isArray(item)
        ? sortObjectByKey(item as Record<string, unknown>)
        : item
    )));
  }

  return String(value);
};

const createSignatureString = (data: Record<string, unknown>) =>
  Object.entries(sortObjectByKey(data))
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${valueToSignatureString(value)}`)
    .join("&");

const generateProviderOrderCode = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = Math.floor(100000000 + Math.random() * 900000000);
    const exists = await PaymentTransaction.exists({ providerOrderCode: code });
    if (!exists) return code;
  }

  throw new ApiError(500, "Khong the tao ma thanh toan payOS");
};

export const createPayosPaymentLink = async (orderId: string, userId: Types.ObjectId | string) => {
  assertPayosConfig();

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Khong tim thay don hang");
  }

  if (String(order.user) !== String(userId)) {
    throw new ApiError(403, "Ban khong co quyen thanh toan don hang nay");
  }

  if (order.paymentMethod !== "ONLINE") {
    throw new ApiError(400, "Don hang khong su dung thanh toan online");
  }

  if (order.orderStatus === "cancelled") {
    throw new ApiError(400, "Khong the thanh toan don hang da huy");
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "Don hang da duoc thanh toan");
  }

  const existingTransaction = await PaymentTransaction.findOne({
    order: order._id,
    provider: "payos",
    status: "PENDING"
  });

  if (existingTransaction?.checkoutUrl) {
    return { order, transaction: existingTransaction };
  }

  const providerOrderCode = await generateProviderOrderCode();
  const description = `GL${String(providerOrderCode).slice(-7)}`;
  const returnUrl = `${env.clientUrl}/orders/${order._id}`;
  const cancelUrl = `${env.clientUrl}/orders/${order._id}`;
  const amount = Math.round(order.total);

  const signature = sign(createSignatureString({
    amount,
    cancelUrl,
    description,
    orderCode: providerOrderCode,
    returnUrl
  }));

  const payload = {
    orderCode: providerOrderCode,
    amount,
    description,
    buyerName: order.shippingAddress.recipientName,
    buyerPhone: order.shippingAddress.phone,
    items: order.items.map((item) => ({
      name: item.title,
      quantity: item.quantity,
      price: item.price
    })),
    cancelUrl,
    returnUrl,
    signature
  };

  const response = await fetch(`${env.payosApiUrl}/v2/payment-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": env.payosClientId as string,
      "x-api-key": env.payosApiKey as string,
      ...(env.payosPartnerCode ? { "x-partner-code": env.payosPartnerCode } : {})
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json() as PayosCreateResponse;
  if (!response.ok || result.code !== "00" || !result.data) {
    throw new ApiError(502, result.desc || "Khong the tao link thanh toan payOS");
  }

  const transaction = await PaymentTransaction.create({
    order: order._id,
    provider: "payos",
    providerOrderCode,
    paymentLinkId: result.data.paymentLinkId,
    checkoutUrl: result.data.checkoutUrl,
    qrCode: result.data.qrCode,
    amount,
    description,
    status: result.data.status === "PAID" ? "PAID" : "PENDING",
    rawResponse: result
  });

  order.statusHistory.push({
    status: order.orderStatus,
    note: "Đã tạo link thanh toán payOS",
    changedAt: new Date()
  });
  await order.save();

  return { order, transaction };
};

export const verifyPayosWebhook = (body: PayosWebhookBody) => {
  assertPayosConfig();

  if (!body?.data || !body.signature) {
    return false;
  }

  const expectedSignature = sign(createSignatureString(body.data));
  return expectedSignature === body.signature;
};

export const handlePayosWebhook = async (body: PayosWebhookBody) => {
  if (!verifyPayosWebhook(body)) {
    throw new ApiError(400, "Chu ky webhook payOS khong hop le");
  }

  const providerOrderCode = Number(body.data.orderCode);
  const transaction = await PaymentTransaction.findOne({
    provider: "payos",
    providerOrderCode
  });

  if (!transaction) {
    throw new ApiError(404, "Khong tim thay giao dich payOS");
  }

  transaction.rawWebhook = body;
  transaction.reference = body.data.reference;

  const isPaid = body.success
    && body.code === "00"
    && body.data.code === "00"
    && Number(body.data.amount) === transaction.amount;

  if (isPaid) {
    transaction.status = "PAID";
    transaction.paidAt = body.data.transactionDateTime
      ? new Date(body.data.transactionDateTime)
      : new Date();

    const order = await Order.findById(transaction.order);
    if (order && order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.statusHistory.push({
        status: order.orderStatus,
        note: `payOS da xac nhan thanh toan ${transaction.reference ?? ""}`.trim(),
        changedAt: new Date()
      });
      await order.save();
      await order.populate("user", "name email phone");
      sendPaymentSuccessEmail(order).catch((error) => {
        console.error("Payment email failed", error);
      });
      createNotification({
        user: order.user,
        audience: "user",
        type: "payment",
        title: "Thanh toán thành công",
        message: `Đơn ${order.orderCode} đã được xác nhận thanh toán.`,
        link: `/orders/${order._id}`
      }).catch(console.error);
      notifyAdmins(
        "payment",
        "Thanh toán VietQR thành công",
        `Đơn ${order.orderCode} đã được payOS xác nhận thanh toán.`,
        "/admin/orders"
      ).catch(console.error);
    }
  } else if (transaction.status !== "PAID") {
    transaction.status = "FAILED";
  }

  await transaction.save();
  return transaction;
};
