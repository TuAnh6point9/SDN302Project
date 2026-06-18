import { Document, Model, Schema, Types, model } from "mongoose";

export type NotificationType = "order" | "payment" | "inventory" | "system";

export interface INotification extends Document {
  user?: Types.ObjectId;
  audience: "user" | "admin";
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    audience: { type: String, enum: ["user", "admin"], required: true, index: true },
    type: { type: String, enum: ["order", "payment", "inventory", "system"], required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    link: { type: String, trim: true },
    readAt: { type: Date }
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, user: 1, readAt: 1, createdAt: -1 });

export const Notification: Model<INotification> = model<INotification>(
  "Notification",
  notificationSchema
);
