import { Schema, model, Document } from "mongoose";

export interface IOtpSession extends Document {
  email: string;
  name: string;
  avatar?: string;
  otp: string;
  expiresAt: Date;
  resendTimestamps: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const otpSessionSchema = new Schema<IOtpSession>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    avatar: {
      type: String,
      trim: true
    },
    otp: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    resendTimestamps: {
      type: [Date],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically delete the OTP session once expiresAt is reached
otpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpSession = model<IOtpSession>("OtpSession", otpSessionSchema);
