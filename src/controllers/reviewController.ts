import { Request, Response } from "express";
import { Book } from "../models/Book";
import { Order } from "../models/Order";
import { Review } from "../models/Review";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const refreshBookRating = async (bookId: string) => {
  const stats = await Review.aggregate([
    { $match: { book: new Book.base.Types.ObjectId(bookId) } },
    {
      $group: {
        _id: "$book",
        ratingAverage: { $avg: "$rating" },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  await Book.findByIdAndUpdate(bookId, {
    ratingAverage: stats[0] ? Number(stats[0].ratingAverage.toFixed(1)) : 0,
    numReviews: stats[0]?.numReviews ?? 0
  });
};

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    throw new ApiError(404, "Khong tim thay sach");
  }

  const purchasedOrder = await Order.findOne({
    user: req.user!._id,
    orderStatus: "delivered",
    "items.book": book._id
  }).select("_id");

  if (!purchasedOrder) {
    throw new ApiError(403, "Chi khach hang da mua va nhan sach moi co the danh gia");
  }

  const review = await Review.create({
    user: req.user!._id,
    book: book._id,
    rating: req.body.rating,
    comment: req.body.comment
  });

  await refreshBookRating(String(book._id));
  res.status(201).json({ review });
});

export const getBookReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const reviews = await Review.find({ book: req.params.id })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.json({ reviews });
  }
);

export const getAllReviews = asyncHandler(async (_req: Request, res: Response) => {
  const reviews = await Review.find()
    .populate("user", "name email avatar")
    .populate("book", "title slug")
    .sort({ createdAt: -1 });

  res.json({ reviews });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findByIdAndDelete(req.params.reviewId);

  if (!review) {
    throw new ApiError(404, "Khong tim thay danh gia");
  }

  await refreshBookRating(String(review.book));
  res.json({ message: "Da xoa danh gia" });
});
