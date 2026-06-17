import { Router } from "express";
import { changePassword, getMe, login, register, updateMe } from "../controllers/authController";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema
} from "../validations/schemas";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, getMe);
router.put("/me", protect, validate(updateProfileSchema), updateMe);
router.put("/password", protect, validate(changePasswordSchema), changePassword);

export default router;
