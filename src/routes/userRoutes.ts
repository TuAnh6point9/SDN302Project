import { Router } from "express";
import { getUsers, updateUser } from "../controllers/userController";
import { protect, requireAdmin } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { updateUserSchema, userParamsSchema } from "../validations/schemas";

const router = Router();

router.use(protect, requireAdmin);

router.get("/", getUsers);
router.put("/:id", validate(userParamsSchema.merge(updateUserSchema)), updateUser);

export default router;
