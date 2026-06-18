import { Request, Response } from "express";
import { Notification } from "../models/Notification";
import { asyncHandler } from "../utils/asyncHandler";

const notificationFilter = (req: Request) => {
  if (req.user!.role === "admin") {
    return { audience: "admin" };
  }

  return { audience: "user", user: req.user!._id };
};

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await Notification.find(notificationFilter(req))
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await Notification.countDocuments({
    ...notificationFilter(req),
    readAt: { $exists: false }
  });

  res.json({ notifications, unreadCount });
});

export const markNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany(
    { ...notificationFilter(req), readAt: { $exists: false } },
    { $set: { readAt: new Date() } }
  );

  res.json({ message: "Da danh dau da doc" });
});
