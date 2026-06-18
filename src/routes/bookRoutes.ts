import { Router } from "express";
import {
  createBook,
  deleteBook,
  getBookById,
  getBooks,
  updateBook
} from "../controllers/bookController";
import { exportBooksCsv, importBooksCsv } from "../controllers/bookCsvController";
import { createReview, getBookReviews } from "../controllers/reviewController";
import { protect, requireAdmin } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  bookParamsSchema,
  createBookSchema,
  createReviewSchema,
  importBooksCsvSchema,
  listBooksSchema,
  listReviewsSchema,
  updateBookSchema
} from "../validations/schemas";

const router = Router();

router.get("/", validate(listBooksSchema), getBooks);
router.get("/admin/export", protect, requireAdmin, exportBooksCsv);
router.post("/admin/import", protect, requireAdmin, validate(importBooksCsvSchema), importBooksCsv);
router.get("/:id", validate(bookParamsSchema), getBookById);
router.post("/", protect, requireAdmin, validate(createBookSchema), createBook);
router.put("/:id", protect, requireAdmin, validate(updateBookSchema), updateBook);
router.delete("/:id", protect, requireAdmin, validate(bookParamsSchema), deleteBook);

router.post("/:id/reviews", protect, validate(createReviewSchema), createReview);
router.get("/:id/reviews", validate(listReviewsSchema), getBookReviews);

export default router;
