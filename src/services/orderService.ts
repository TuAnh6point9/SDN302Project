import mongoose, { Types } from "mongoose";
import { Book } from "../models/Book";
import { Cart } from "../models/Cart";
import { IShippingAddress, Order } from "../models/Order";
import { ApiError } from "../utils/ApiError";
import { generateOrderCode } from "../utils/orderCode";

interface CreateOrderItemInput {
  book: string;
  quantity: number;
}

interface CreateOrderInput {
  userId: Types.ObjectId | string;
  items?: CreateOrderItemInput[];
  shippingAddress: IShippingAddress;
  shippingFee: number;
}

const mergeItems = (items: CreateOrderItemInput[]) => {
  const merged = new Map<string, number>();

  items.forEach((item) => {
    merged.set(item.book, (merged.get(item.book) ?? 0) + item.quantity);
  });

  return [...merged.entries()].map(([book, quantity]) => ({ book, quantity }));
};

export const createOrderWithStockTransaction = async ({
  userId,
  items,
  shippingAddress,
  shippingFee
}: CreateOrderInput) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userObjectId = new Types.ObjectId(String(userId));
    let orderItemsInput = items;

    if (!orderItemsInput?.length) {
      const cart = await Cart.findOne({ user: userObjectId }).session(session);
      orderItemsInput = cart?.items.map((item) => ({
        book: String(item.book),
        quantity: item.quantity
      }));
    }

    if (!orderItemsInput?.length) {
      throw new ApiError(400, "Giỏ hàng đang trống");
    }

    const normalizedItems = mergeItems(orderItemsInput);
    const snapshotItems = [];

    for (const item of normalizedItems) {
      // Điều kiện stockQuantity >= quantity giúp tránh oversell khi nhiều request chạy đồng thời.
      const book = await Book.findOneAndUpdate(
        { _id: item.book, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity } },
        { new: true, session }
      );

      if (!book) {
        throw new ApiError(400, "Một hoặc nhiều sách không đủ tồn kho");
      }

      const price = book.discountPrice ?? book.price;
      snapshotItems.push({
        book: book._id,
        title: book.title,
        price,
        quantity: item.quantity
      });
    }

    const subtotal = snapshotItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const total = subtotal + shippingFee;

    // Order lưu snapshot title/price để lịch sử mua hàng không đổi khi sách cập nhật giá sau này.
    const [order] = await Order.create(
      [
        {
          orderCode: generateOrderCode(),
          user: userObjectId,
          items: snapshotItems,
          subtotal,
          shippingFee,
          total,
          shippingAddress,
          paymentMethod: "COD",
          paymentStatus: "pending",
          orderStatus: "pending"
        }
      ],
      { session }
    );

    await Cart.updateOne(
      { user: userObjectId },
      { $set: { items: [] } },
      { session }
    );

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
