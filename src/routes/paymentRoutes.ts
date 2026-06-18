import { Router } from "express";
import { createPayosPayment, payosWebhook } from "../controllers/paymentController";
import { protect } from "../middlewares/auth";
import { paymentWebhookRateLimiter } from "../middlewares/rateLimiters";
import { validate } from "../middlewares/validate";
import { payosOrderParamsSchema } from "../validations/schemas";

const router = Router();

router.post("/payos/webhook", paymentWebhookRateLimiter, payosWebhook);
router.post(
  "/payos/orders/:orderId/create",
  protect,
  validate(payosOrderParamsSchema),
  createPayosPayment
);

export default router;
