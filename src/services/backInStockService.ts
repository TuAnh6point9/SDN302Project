import { IBook } from "../models/Book";
import { BookSubscription } from "../models/BookSubscription";
import { IUser } from "../models/User";
import { createNotification } from "./notificationService";
import { sendBackInStockEmail } from "./emailService";

// Gọi khi Book.stockQuantity chuyển từ 0 sang > 0. Xoá từng subscription
// ngay sau khi notify trong-app thành công để không báo trùng — email chỉ
// best-effort, không chặn việc xoá.
export const notifyBackInStockSubscribers = async (book: IBook) => {
  const subscriptions = await BookSubscription.find({ book: book._id }).populate<{ user: IUser }>(
    "user",
    "name email"
  );

  for (const subscription of subscriptions) {
    const user = subscription.user;
    if (!user) continue;

    try {
      await createNotification({
        user: user._id,
        audience: "user",
        type: "inventory",
        title: "Sách đã có hàng trở lại",
        message: `${book.title} hiện đã có hàng trở lại, đặt hàng ngay!`,
        link: `/books/${book.slug}`
      });
      await BookSubscription.deleteOne({ _id: subscription._id });
    } catch (error) {
      console.error("Failed to notify back-in-stock subscriber:", error);
      continue;
    }

    sendBackInStockEmail(user.email, book).catch(console.error);
  }
};
