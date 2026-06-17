import { Router } from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist
} from "../controllers/wishlistController";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { wishlistParamsSchema } from "../validations/schemas";

const router = Router();

router.use(protect);

router.get("/", getWishlist);
router.post("/:bookId", validate(wishlistParamsSchema), addToWishlist);
router.delete("/:bookId", validate(wishlistParamsSchema), removeFromWishlist);

export default router;
