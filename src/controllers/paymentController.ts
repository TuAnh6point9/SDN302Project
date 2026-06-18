import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { createPayosPaymentLink, handlePayosWebhook } from "../services/payosService";

export const createPayosPayment = asyncHandler(async (req: Request, res: Response) => {
  const { order, transaction } = await createPayosPaymentLink(req.params.orderId, req.user!._id);

  res.status(201).json({
    order,
    payment: {
      id: transaction._id,
      provider: transaction.provider,
      providerOrderCode: transaction.providerOrderCode,
      paymentLinkId: transaction.paymentLinkId,
      checkoutUrl: transaction.checkoutUrl,
      qrCode: transaction.qrCode,
      amount: transaction.amount,
      description: transaction.description,
      status: transaction.status
    }
  });
});

export const payosWebhook = asyncHandler(async (req: Request, res: Response) => {
  await handlePayosWebhook(req.body);
  res.json({ success: true });
});
