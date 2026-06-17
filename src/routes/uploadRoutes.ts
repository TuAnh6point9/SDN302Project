import { NextFunction, Request, Response, Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { protect, requireAdmin } from "../middlewares/auth";
import { ApiError } from "../utils/ApiError";

const uploadDir = path.resolve(process.cwd(), "uploads", "books");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = allowedMimeTypes.get(file.mimetype) ?? path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    cb(null, `${Date.now()}-${baseName || "book-cover"}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new ApiError(400, "Chi ho tro anh JPG, PNG hoac WEBP"));
      return;
    }

    cb(null, true);
  }
});

const router = Router();

const uploadBookImage = (req: Request, res: Response, next: NextFunction) => {
  upload.single("image")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(new ApiError(400, "Anh khong duoc vuot qua 3MB"));
        return;
      }
      next(new ApiError(400, error.message));
      return;
    }

    if (error) {
      next(error);
      return;
    }

    if (!req.file) {
      next(new ApiError(400, "Vui long chon file anh"));
      return;
    }

    res.status(201).json({
      url: `/uploads/books/${req.file.filename}`
    });
  });
};

router.post("/books", protect, requireAdmin, uploadBookImage);

export default router;
