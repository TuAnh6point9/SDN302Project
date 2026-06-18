import nodemailer from "nodemailer";
import { env } from "../config/env";
import { IOrder } from "../models/Order";
import { IUser } from "../models/User";

const isEmailEnabled = () => Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

const transporter = () => nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpSecure,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass
  }
});

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const sendMail = async (to: string | undefined, subject: string, text: string) => {
  if (!to) return;

  if (!isEmailEnabled()) {
    if (env.nodeEnv !== "production") {
      console.log(`[email skipped] ${subject} -> ${to}`);
    }
    return;
  }

  await transporter().sendMail({
    from: env.mailFrom,
    to,
    subject,
    text
  });
};

const userEmail = (user: IOrder["user"]) => {
  if (typeof user === "object" && "email" in user) {
    return String((user as unknown as IUser).email);
  }

  return undefined;
};

export const sendOrderCreatedEmail = async (order: IOrder) => {
  const subject = `GreenLeaf Books - Đơn hàng ${order.orderCode} đã được tạo`;
  const text = [
    `Cảm ơn bạn đã đặt hàng tại GreenLeaf Books.`,
    `Mã đơn: ${order.orderCode}`,
    `Tổng tiền: ${formatPrice(order.total)}`,
    `Trạng thái thanh toán: ${order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}`,
    `Chúng tôi sẽ tiếp tục cập nhật khi đơn hàng được xử lý.`
  ].join("\n");

  await sendMail(userEmail(order.user), subject, text);
  await sendMail(env.adminEmail, `Đơn hàng mới ${order.orderCode}`, text);
};

export const sendOrderStatusEmail = async (order: IOrder) => {
  const subject = `GreenLeaf Books - Cập nhật đơn hàng ${order.orderCode}`;
  const text = [
    `Đơn hàng ${order.orderCode} vừa được cập nhật.`,
    `Trạng thái đơn: ${order.orderStatus}`,
    `Trạng thái thanh toán: ${order.paymentStatus}`,
    order.cancelReason ? `Lý do hủy: ${order.cancelReason}` : undefined
  ].filter(Boolean).join("\n");

  await sendMail(userEmail(order.user), subject, text);
};

export const sendPaymentSuccessEmail = async (order: IOrder) => {
  const subject = `GreenLeaf Books - Thanh toán thành công ${order.orderCode}`;
  const text = [
    `Thanh toán cho đơn hàng ${order.orderCode} đã được xác nhận.`,
    `Số tiền: ${formatPrice(order.total)}`,
    `GreenLeaf Books sẽ tiếp tục xử lý đơn hàng của bạn.`
  ].join("\n");

  await sendMail(userEmail(order.user), subject, text);
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const subject = "GreenLeaf Books - Đặt lại mật khẩu";
  const text = [
    "Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản GreenLeaf Books.",
    `Mở liên kết sau để đặt lại mật khẩu: ${resetUrl}`,
    "Liên kết có hiệu lực trong 30 phút.",
    "Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email này."
  ].join("\n");

  await sendMail(email, subject, text);
};
