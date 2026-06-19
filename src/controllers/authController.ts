import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";
import { env } from "../config/env";
import { IUserAddress } from "../models/User";
import { User } from "../models/User";
import { sendPasswordResetEmail, sendOtpEmail } from "../services/emailService";
import { OtpSession } from "../models/OtpSession";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { signToken } from "../utils/jwt";
import { serializeAuth } from "../utils/response";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, addresses } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email đã được sử dụng");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    phone,
    addresses
  });

  const token = signToken(user);
  res.status(201).json(serializeAuth(user, token));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    throw new ApiError(401, "Email hoặc mật khẩu không đúng");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Tai khoan dang bi khoa");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, "Email hoặc mật khẩu không đúng");
  }

  const token = signToken(user);
  res.json(serializeAuth(user, token));
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: req.user });
});

const normalizeAddresses = (addresses?: IUserAddress[]) => {
  if (!addresses?.length) return addresses;

  let hasDefault = false;
  return addresses.map((address, index) => {
    const isDefault = address.isDefault && !hasDefault;
    if (isDefault) {
      hasDefault = true;
    }

    return {
      ...address,
      isDefault: isDefault || (!hasDefault && index === addresses.length - 1)
    };
  });
};

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const update: {
    name?: string;
    phone?: string;
    avatar?: string;
    addresses?: IUserAddress[];
  } = {};

  if (req.body.name !== undefined) update.name = req.body.name;
  if (req.body.phone !== undefined) update.phone = req.body.phone;
  if (req.body.avatar !== undefined) update.avatar = req.body.avatar;
  if (req.body.addresses !== undefined) {
    update.addresses = normalizeAddresses(req.body.addresses);
  }

  const user = await User.findByIdAndUpdate(req.user!._id, update, {
    new: true,
    runValidators: true
  });

  res.json({ user });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id).select("+passwordHash");

  if (!user) {
    throw new ApiError(404, "Khong tim thay nguoi dung");
  }

  const isMatch = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(400, "Mat khau hien tai khong dung");
  }

  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();

  res.json({ message: "Da doi mat khau" });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
    sendPasswordResetEmail(user.email, resetUrl).catch((error) => {
      console.error("Password reset email failed", error);
    });
  }

  res.json({
    message: "Neu email ton tai, he thong se gui lien ket dat lai mat khau"
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const tokenHash = crypto.createHash("sha256").update(req.body.token).digest("hex");
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() }
  }).select("+passwordHash +resetPasswordTokenHash +resetPasswordExpires");

  if (!user) {
    throw new ApiError(400, "Lien ket dat lai mat khau khong hop le hoac da het han");
  }

  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Da dat lai mat khau" });
});

export const googleLoginRedirect = asyncHandler(async (req: Request, res: Response) => {
  const { googleClientId, googleCallbackUrl } = env;
  if (!googleClientId) {
    throw new ApiError(500, "Google OAuth Client ID is not configured on the server.");
  }
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(googleCallbackUrl)}&response_type=code&scope=email%20profile%20openid&state=google_auth`;
  
  res.redirect(authUrl);
});

export const googleLoginCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) {
    throw new ApiError(400, "Authorization code is missing.");
  }

  const { googleClientId, googleClientSecret, googleCallbackUrl, clientUrl } = env;
  if (!googleClientId || !googleClientSecret) {
    throw new ApiError(500, "Google OAuth Credentials are not configured on the server.");
  }

  // 1. Exchange authorization code for tokens
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code: String(code),
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: googleCallbackUrl,
      grant_type: "authorization_code"
    }).toString()
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    console.error("Google token exchange error:", errorData);
    throw new ApiError(400, "Failed to exchange authorization code for Google token.");
  }

  const tokens = await tokenResponse.json() as { access_token: string; id_token: string };

  // 2. Fetch user profile info from Google
  const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`
    }
  });

  if (!userinfoResponse.ok) {
    throw new ApiError(400, "Failed to fetch user profile info from Google.");
  }

  const userInfo = await userinfoResponse.json() as {
    email: string;
    name: string;
    picture?: string;
    email_verified?: boolean;
  };

  if (!userInfo.email) {
    throw new ApiError(400, "Google account does not have an email address associated with it.");
  }

  // 3. Check if user already exists
  const existingUser = await User.findOne({ email: userInfo.email });
  if (existingUser) {
    if (!existingUser.isActive) {
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Tài khoản của bạn đã bị khóa.")}`);
    }

    // Log in directly
    const token = signToken(existingUser);
    return res.redirect(`${clientUrl}/auth-callback?token=${token}`);
  }

  // 4. Email does not exist. Trigger OTP Verification
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await OtpSession.findOneAndUpdate(
    { email: userInfo.email.toLowerCase() },
    {
      email: userInfo.email.toLowerCase(),
      name: userInfo.name || "Google User",
      avatar: userInfo.picture,
      otp,
      expiresAt,
      resendTimestamps: []
    },
    { upsert: true, new: true }
  );

  await sendOtpEmail(userInfo.email, otp);

  res.redirect(`${clientUrl}/verify-otp?email=${encodeURIComponent(userInfo.email.toLowerCase())}`);
});

export const verifyGoogleOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(400, "Vui lòng nhập đầy đủ email và mã OTP.");
  }

  const session = await OtpSession.findOne({ email: email.toLowerCase() });
  if (!session) {
    throw new ApiError(400, "Không tìm thấy yêu cầu xác thực hoặc mã OTP đã hết hạn.");
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await OtpSession.deleteOne({ _id: session._id });
    throw new ApiError(400, "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.");
  }

  if (session.otp !== otp) {
    throw new ApiError(400, "Mã OTP không chính xác.");
  }

  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
  const user = await User.create({
    name: session.name,
    email: session.email,
    passwordHash,
    avatar: session.avatar,
    role: "customer",
    isActive: true
  });

  await OtpSession.deleteOne({ _id: session._id });

  const token = signToken(user);
  res.status(201).json(serializeAuth(user, token));
});

export const resendGoogleOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Vui lòng nhập địa chỉ email.");
  }

  const session = await OtpSession.findOne({ email: email.toLowerCase() });
  if (!session) {
    throw new ApiError(400, "Không tìm thấy yêu cầu xác thực hoặc phiên đã hết hạn. Vui lòng thử đăng nhập lại bằng Google.");
  }

  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  const recentResends = session.resendTimestamps.filter((t) => t >= fifteenMinutesAgo);

  if (recentResends.length >= 3) {
    throw new ApiError(429, "Bạn đã gửi lại mã OTP tối đa 3 lần trong 15 phút. Vui lòng đợi 15 phút trước khi thử lại.");
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const newExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);

  session.otp = newOtp;
  session.expiresAt = newExpiresAt;
  session.resendTimestamps.push(now);
  await session.save();

  await sendOtpEmail(session.email, newOtp);

  res.json({ message: "Mã OTP mới đã được gửi tới email của bạn." });
});
