import { Document, Model, Schema, Types, model } from "mongoose";

export type InventoryMovementType = "import" | "adjustment" | "sale" | "return";

export interface IInventoryMovement extends Document {
  book: Types.ObjectId;
  type: InventoryMovementType;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  note?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true },
    type: {
      type: String,
      enum: ["import", "adjustment", "sale", "return"],
      required: true,
      index: true
    },
    quantityChange: { type: Number, required: true },
    quantityBefore: { type: Number, required: true, min: 0 },
    quantityAfter: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ createdAt: -1 });

export const InventoryMovement: Model<IInventoryMovement> = model<IInventoryMovement>(
  "InventoryMovement",
  inventoryMovementSchema
);
