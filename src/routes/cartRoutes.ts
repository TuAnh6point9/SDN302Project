import { Router } from "express";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem
} from "../controllers/cartController";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  addCartItemSchema,
  cartItemParamsSchema,
  updateCartItemSchema
} from "../validations/schemas";

const router = Router();

router.use(protect);

router.get("/", getCart);
router.post("/", validate(addCartItemSchema), addCartItem);
router.put("/:itemId", validate(updateCartItemSchema), updateCartItem);
router.delete("/:itemId", validate(cartItemParamsSchema), removeCartItem);

export default router;
