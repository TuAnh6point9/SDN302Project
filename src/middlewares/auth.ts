import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

interface JwtPayload {
  userId: string;
}

export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;

    if (!token) {
      throw new ApiError(401, "Bạn cần đăng nhập");
    }

    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new ApiError(401, "Token không còn hợp lệ");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Tai khoan dang bi khoa");
    }

    req.user = user;
    next();
  }
);

export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== "admin") {
    next(new ApiError(403, "Bạn không có quyền admin"));
    return;
  }

  next();
};
