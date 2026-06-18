import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";
import { env } from "../config/env";
import { IUserAddress } from "../models/User";
import { User } from "../models/User";
import { sendPasswordResetEmail } from "../services/emailService";
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
