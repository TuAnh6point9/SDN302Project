import nodemailer from "nodemailer";
import { env } from "../config/env";
import { IBook } from "../models/Book";
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

const sendMail = async (to: string | undefined, subject: string, text: string, html?: string) => {
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
    text,
    html
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

export const sendBackInStockEmail = async (email: string | undefined, book: Pick<IBook, "title" | "slug">) => {
  const subject = `GreenLeaf Books - ${book.title} đã có hàng trở lại`;
  const text = [
    `Cuốn sách "${book.title}" mà bạn đăng ký theo dõi đã có hàng trở lại.`,
    `Xem chi tiết và đặt hàng: ${env.clientUrl}/books/${book.slug}`
  ].join("\n");

  await sendMail(email, subject, text);
};

export const sendOtpEmail = async (email: string, otp: string) => {
  const subject = "GreenLeaf Books - Mã xác thực đăng ký";
  const text = `Chào mừng bạn đến với GreenLeaf Books!\nMã OTP xác thực đăng ký tài khoản mới của bạn là: ${otp}\nMã OTP này có thời hạn sử dụng là 5 phút.`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 40px 10px; margin: 0; min-height: 100%;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #eef2f1;">
        <!-- Header -->
        <tr>
          <td align="center" style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 40px 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">GreenLeaf Books</h1>
            <p style="color: #bbf7d0; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Thế giới Sách Động vật & Thực vật</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px; font-weight: 700; text-align: center;">Xác thực tài khoản của bạn</h2>
            <p style="color: #475569; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; text-align: center;">
              Chào mừng bạn đến với <strong>GreenLeaf Books</strong>! Bạn đã yêu cầu đăng ký tài khoản mới. Hãy nhập mã xác thực OTP dưới đây để hoàn tất quá trình tạo tài khoản của mình.
            </p>
            
            <!-- OTP Code Card -->
            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
              <tr>
                <td align="center" style="background-color: #f1f5f9; padding: 18px 40px; border-radius: 16px; border: 2px dashed #cbd5e1;">
                  <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #16a34a; letter-spacing: 6px; display: block; text-shadow: 1px 1px 0px #ffffff;">${otp}</span>
                </td>
              </tr>
            </table>
            
            <p style="color: #ef4444; margin: 0 0 20px 0; font-size: 13px; font-weight: 600; text-align: center;">
              ⚠️ Lưu ý: Mã OTP này chỉ có hiệu lực trong vòng 5 phút.
            </p>
            <div style="border-top: 1px solid #f1f5f9; padding-top: 24px;">
              <p style="color: #64748b; margin: 0; font-size: 13px; line-height: 1.5; text-align: center;">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này một cách an toàn. Mọi thắc mắc xin phản hồi trực tiếp tới email này.
              </p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td align="center" style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #f1f5f9;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">&copy; 2026 GreenLeaf Books. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  if (!isEmailEnabled()) {
    console.log(`\n==========================================\n[DEVELOPMENT] Gửi OTP cho ${email}: ${otp}\n==========================================\n`);
  }

  await sendMail(email, subject, text, html);
};
