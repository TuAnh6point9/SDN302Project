import { Request, Response } from "express";
import { Book } from "../models/Book";
import { InventoryMovement } from "../models/InventoryMovement";
import { notifyBackInStockSubscribers } from "../services/backInStockService";
import { createNotification, notifyAdmins } from "../services/notificationService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const getInventoryMovements = asyncHandler(async (_req: Request, res: Response) => {
  const movements = await InventoryMovement.find()
    .populate("book", "title slug stockQuantity")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json({ movements });
});

export const adjustInventory = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.findById(req.params.bookId);

  if (!book) {
    throw new ApiError(404, "Khong tim thay sach");
  }

  const quantityBefore = book.stockQuantity;
  const quantityAfter = req.body.mode === "set"
    ? req.body.quantity
    : quantityBefore + req.body.quantityChange;

  if (quantityAfter < 0) {
    throw new ApiError(400, "Ton kho khong duoc nho hon 0");
  }

  book.stockQuantity = quantityAfter;
  await book.save();

  const movement = await InventoryMovement.create({
    book: book._id,
    type: req.body.type,
    quantityChange: quantityAfter - quantityBefore,
    quantityBefore,
    quantityAfter,
    note: req.body.note,
    createdBy: req.user!._id
  });

  if (quantityAfter === 0 || quantityAfter <= 5) {
    await notifyAdmins(
      "inventory",
      quantityAfter === 0 ? "Sách đã hết hàng" : "Sách sắp hết hàng",
      `${book.title} hiện còn ${quantityAfter} cuốn.`,
      `/admin/books`
    );
  }

  await createNotification({
    audience: "admin",
    type: "inventory",
    title: "Tồn kho đã được điều chỉnh",
    message: `${book.title}: ${quantityBefore} -> ${quantityAfter}`,
    link: "/admin/inventory"
  });

  if (quantityBefore === 0 && quantityAfter > 0) {
    notifyBackInStockSubscribers(book).catch(console.error);
  }

  res.json({ book, movement });
});
