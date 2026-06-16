import { Request, Response } from "express";
import { Cart } from "../models/Cart";
import { Book } from "../models/Book";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const getOrCreateCart = async (userId: string) => {
  const cart = await Cart.findOne({ user: userId });
  if (cart) return cart;

  return Cart.create({ user: userId, items: [] });
};

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await getOrCreateCart(String(req.user!._id));
  await cart.populate("items.book", "title slug price discountPrice images stockQuantity");

  res.json({ cart });
});

export const addCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { book: bookId, quantity } = req.body;
  const book = await Book.findById(bookId);

  if (!book) {
    throw new ApiError(404, "Không tìm thấy sách");
  }

  if (book.stockQuantity < quantity) {
    throw new ApiError(400, "Số lượng tồn kho không đủ");
  }

  const cart = await getOrCreateCart(String(req.user!._id));
  const existingItem = cart.items.find((item) => String(item.book) === bookId);

  if (existingItem) {
    const nextQuantity = existingItem.quantity + quantity;
    if (book.stockQuantity < nextQuantity) {
      throw new ApiError(400, "Số lượng tồn kho không đủ");
    }
    existingItem.quantity = nextQuantity;
  } else {
    cart.items.push({ book: book._id, quantity } as never);
  }

  await cart.save();
  await cart.populate("items.book", "title slug price discountPrice images stockQuantity");

  res.status(201).json({ cart });
});

export const updateCartItem = asyncHandler(
  async (req: Request, res: Response) => {
    const cart = await getOrCreateCart(String(req.user!._id));
    const item = cart.items.find((cartItem) => String(cartItem._id) === req.params.itemId);

    if (!item) {
      throw new ApiError(404, "Không tìm thấy item trong giỏ hàng");
    }

    const book = await Book.findById(item.book);
    if (!book) {
      throw new ApiError(404, "Sách không còn tồn tại");
    }

    if (book.stockQuantity < req.body.quantity) {
      throw new ApiError(400, "Số lượng tồn kho không đủ");
    }

    item.quantity = req.body.quantity;
    await cart.save();
    await cart.populate("items.book", "title slug price discountPrice images stockQuantity");

    res.json({ cart });
  }
);

export const removeCartItem = asyncHandler(
  async (req: Request, res: Response) => {
    const cart = await getOrCreateCart(String(req.user!._id));
    const itemIndex = cart.items.findIndex(
      (cartItem) => String(cartItem._id) === req.params.itemId
    );
    const item = cart.items[itemIndex];

    if (!item) {
      throw new ApiError(404, "Không tìm thấy item trong giỏ hàng");
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();
    await cart.populate("items.book", "title slug price discountPrice images stockQuantity");

    res.json({ cart });
  }
);
