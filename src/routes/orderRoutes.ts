import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus
} from "../controllers/orderController";
import { protect, requireAdmin } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createOrderSchema,
  listAdminOrdersSchema,
  orderParamsSchema,
  updateOrderStatusSchema
} from "../validations/schemas";

const router = Router();

router.use(protect);

router.post("/", validate(createOrderSchema), createOrder);
router.get("/", getMyOrders);
router.get("/all", requireAdmin, validate(listAdminOrdersSchema), getAllOrders);
router.get("/:id", validate(orderParamsSchema), getOrderById);
router.put(
  "/:id/status",
  requireAdmin,
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;
