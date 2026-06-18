import { Router } from "express";
import { adjustInventory, getInventoryMovements } from "../controllers/inventoryController";
import { protect, requireAdmin } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { adjustInventorySchema, inventoryBookParamsSchema } from "../validations/schemas";

const router = Router();

router.use(protect, requireAdmin);
router.get("/", getInventoryMovements);
router.post("/:bookId/adjust", validate(inventoryBookParamsSchema.merge(adjustInventorySchema)), adjustInventory);

export default router;
