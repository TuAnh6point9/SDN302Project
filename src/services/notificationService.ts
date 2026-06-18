import { Types } from "mongoose";
import { Notification, NotificationType } from "../models/Notification";

interface CreateNotificationInput {
  user?: Types.ObjectId | string;
  audience: "user" | "admin";
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export const createNotification = async (input: CreateNotificationInput) => {
  return Notification.create({
    ...input,
    user: input.user ? new Types.ObjectId(String(input.user)) : undefined
  });
};

export const notifyAdmins = async (
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) => createNotification({ audience: "admin", type, title, message, link });
