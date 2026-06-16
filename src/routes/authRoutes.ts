import { Router } from "express";
import { getMe, login, register } from "../controllers/authController";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { loginSchema, registerSchema } from "../validations/schemas";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, getMe);

export default router;
