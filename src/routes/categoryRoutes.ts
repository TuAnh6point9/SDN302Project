import { Router } from "express";
import { createCategory, getCategories } from "../controllers/categoryController";
import { protect, requireAdmin } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { categorySchema } from "../validations/schemas";

const router = Router();

router.get("/", getCategories);
router.post("/", protect, requireAdmin, validate(categorySchema), createCategory);

export default router;
