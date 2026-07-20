import { Request, Response } from "express";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";

const VN_TIMEZONE = "+07:00";
const REVENUE_DAYS = 14;

// Doanh thu ghi nhận theo đơn đã giao (delivered) — đồng bộ với cách
// DashboardPage đang tính "Doanh thu đã giao".
export const getAdminOverview = asyncHandler(async (_req: Request, res: Response) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (REVENUE_DAYS - 1));

  const [revenueRaw, topBooks, ordersByStatus, totalsRaw, customerCount] = await Promise.all([
    Order.aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: { orderStatus: "delivered", createdAt: { $gte: start } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: VN_TIMEZONE }
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate<{ _id: unknown; title: string; quantity: number; revenue: number }>([
      { $match: { orderStatus: "delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.book",
          title: { $first: "$items.title" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 }
    ]),
    Order.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
    ]),
    Order.aggregate<{ _id: null; revenue: number; orders: number }>([
      { $match: { orderStatus: "delivered" } },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } }
    ]),
    User.countDocuments({ role: "customer" })
  ]);

  // Điền đủ 14 ngày để chart liền mạch kể cả ngày không có đơn
  const revenueMap = new Map(revenueRaw.map((row) => [row._id, row]));
  const revenueByDay: { day: string; revenue: number; orders: number }[] = [];
  for (let i = 0; i < REVENUE_DAYS; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = date.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
    const row = revenueMap.get(key);
    revenueByDay.push({ day: key, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 });
  }

  res.json({
    revenueByDay,
    topBooks: topBooks.map((book) => ({
      title: book.title,
      quantity: book.quantity,
      revenue: book.revenue
    })),
    ordersByStatus: ordersByStatus.map((row) => ({ status: row._id, count: row.count })),
    totals: {
      deliveredRevenue: totalsRaw[0]?.revenue ?? 0,
      deliveredOrders: totalsRaw[0]?.orders ?? 0,
      totalOrders: await Order.countDocuments(),
      customers: customerCount
    }
  });
});

// Public — chỉ trả danh sách bookId bán chạy để gắn badge, không kèm doanh thu/thông tin khách.
export const getBestSellerBookIds = asyncHandler(async (_req: Request, res: Response) => {
  const topBooks = await Order.aggregate<{ _id: unknown; quantity: number }>([
    { $match: { orderStatus: "delivered" } },
    { $unwind: "$items" },
    { $group: { _id: "$items.book", quantity: { $sum: "$items.quantity" } } },
    { $sort: { quantity: -1 } },
    { $limit: 5 }
  ]);

  res.json({ bookIds: topBooks.map((book) => String(book._id)) });
});
