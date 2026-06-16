import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export const notFound = (): never => {
  throw new ApiError(404, "Không tìm thấy endpoint");
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Dữ liệu không hợp lệ",
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
    return;
  }

  if (error?.name === "CastError") {
    res.status(400).json({ message: "ID không hợp lệ" });
    return;
  }

  if (error?.code === 11000) {
    res.status(409).json({ message: "Dữ liệu đã tồn tại" });
    return;
  }

  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  res.status(statusCode).json({
    message: error.message || "Lỗi máy chủ",
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });
};
