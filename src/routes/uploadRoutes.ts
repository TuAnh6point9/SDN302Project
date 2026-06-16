import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { protect, requireAdmin } from "../middlewares/auth";

const uploadDir = path.resolve(process.cwd(), "uploads", "books");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Chỉ hỗ trợ upload ảnh"));
      return;
    }
    cb(null, true);
  }
});

const router = Router();

router.post(
  "/books",
  protect,
  requireAdmin,
  upload.single("image"),
  (req, res) => {
    res.status(201).json({
      url: `/uploads/books/${req.file?.filename}`
    });
  }
);

export default router;
