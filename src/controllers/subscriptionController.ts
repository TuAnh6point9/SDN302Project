import { Request, Response } from "express";
import { Book } from "../models/Book";
import { BookSubscription } from "../models/BookSubscription";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const subscribeToBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.findById(req.params.id).select("_id stockQuantity");

  if (!book) {
    throw new ApiError(404, "Khong tim thay sach");
  }

  if (book.stockQuantity > 0) {
    throw new ApiError(400, "Sách hiện còn hàng, không cần đăng ký thông báo");
  }

  try {
    await BookSubscription.create({ user: req.user!._id, book: book._id });
  } catch (error) {
    const isDuplicate = (error as { code?: number }).code === 11000;
    if (!isDuplicate) throw error;
  }

  res.status(201).json({ subscribed: true });
});

export const unsubscribeFromBook = asyncHandler(async (req: Request, res: Response) => {
  await BookSubscription.deleteOne({ user: req.user!._id, book: req.params.id });
  res.json({ subscribed: false });
});

export const getSubscriptionStatus = asyncHandler(async (req: Request, res: Response) => {
  const exists = await BookSubscription.exists({ user: req.user!._id, book: req.params.id });
  res.json({ subscribed: Boolean(exists) });
});
