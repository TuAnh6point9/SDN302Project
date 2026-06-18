import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Qua nhieu yeu cau xac thuc. Vui long thu lai sau."
  }
});

export const paymentWebhookRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Qua nhieu yeu cau webhook. Vui long thu lai sau."
  }
});
