import { Router } from "express";
import { deleteReview, getAllReviews } from "../controllers/reviewController";
import { protect, requireAdmin } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { reviewParamsSchema } from "../validations/schemas";

const router = Router();

router.use(protect, requireAdmin);

router.get("/", getAllReviews);
router.delete("/:reviewId", validate(reviewParamsSchema), deleteReview);

export default router;
