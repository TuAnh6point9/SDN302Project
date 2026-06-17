import { Request, Response } from "express";
import { Book } from "../models/Book";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const populateWishlist = async (userId: string) => {
  const user = await User.findById(userId).populate({
    path: "wishlist",
    populate: { path: "category", select: "name slug parent" }
  });

  if (!user) {
    throw new ApiError(404, "Khong tim thay nguoi dung");
  }

  return user.wishlist;
};

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await populateWishlist(String(req.user!._id));
  res.json({ wishlist });
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.findById(req.params.bookId).select("_id");
  if (!book) {
    throw new ApiError(404, "Khong tim thay sach");
  }

  await User.updateOne(
    { _id: req.user!._id },
    { $addToSet: { wishlist: book._id } }
  );

  const wishlist = await populateWishlist(String(req.user!._id));
  res.status(201).json({ wishlist });
});

export const removeFromWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    await User.updateOne(
      { _id: req.user!._id },
      { $pull: { wishlist: req.params.bookId } }
    );

    const wishlist = await populateWishlist(String(req.user!._id));
    res.json({ wishlist });
  }
);
