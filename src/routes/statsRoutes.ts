import { Router } from "express";
import { getAdminOverview } from "../controllers/statsController";
import { protect, requireAdmin } from "../middlewares/auth";

const router = Router();

router.use(protect, requireAdmin);
router.get("/admin/overview", getAdminOverview);

export default router;
