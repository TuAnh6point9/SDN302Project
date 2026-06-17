import { Request, Response } from "express";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  if (String(req.params.id) === String(req.user!._id) && req.body.isActive === false) {
    throw new ApiError(400, "Khong the khoa tai khoan dang su dung");
  }

  const update: { role?: "customer" | "admin"; isActive?: boolean } = {};
  if (req.body.role !== undefined) update.role = req.body.role;
  if (req.body.isActive !== undefined) update.isActive = req.body.isActive;

  const user = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true
  });

  if (!user) {
    throw new ApiError(404, "Khong tim thay nguoi dung");
  }

  res.json({ user });
});
