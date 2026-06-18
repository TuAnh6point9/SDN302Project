import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  getMe,
  login,
  register,
  resetPassword,
  updateMe
} from "../controllers/authController";
import { protect } from "../middlewares/auth";
import { authRateLimiter } from "../middlewares/rateLimiters";
import { validate } from "../middlewares/validate";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema
} from "../validations/schemas";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), register);
router.post("/login", authRateLimiter, validate(loginSchema), login);
router.post("/forgot-password", authRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), resetPassword);
router.get("/me", protect, getMe);
router.put("/me", protect, validate(updateProfileSchema), updateMe);
router.put("/password", protect, validate(changePasswordSchema), changePassword);

export default router;
