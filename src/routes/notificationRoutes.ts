import { Router } from "express";
import { getNotifications, markNotificationsRead } from "../controllers/notificationController";
import { protect } from "../middlewares/auth";

const router = Router();

router.use(protect);
router.get("/", getNotifications);
router.put("/read", markNotificationsRead);

export default router;
