import { Request, Response } from "express";
import { Types } from "mongoose";
import { Category } from "../models/Category";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { toSlug } from "../utils/slug";

const ROOT_CATEGORY_NAMES = ["Động vật", "Thực vật"];

export const getCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await Category.find().sort({ parent: 1, name: 1 }).lean();
    const categoryMap = new Map<string, Record<string, unknown> & { children: unknown[] }>();
    const roots: Array<Record<string, unknown> & { children: unknown[] }> = [];

    categories.forEach((category) => {
      categoryMap.set(String(category._id), { ...category, children: [] });
    });

    categories.forEach((category) => {
      const node = categoryMap.get(String(category._id));
      if (!node) return;

      if (category.parent) {
        const parentNode = categoryMap.get(String(category.parent));
        parentNode?.children.push(node);
        return;
      }

      roots.push(node);
    });

    res.json({ categories: roots });
  }
);

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, parent, image } = req.body;
    const slug = req.body.slug ? toSlug(req.body.slug) : toSlug(name);

    if (!parent && !ROOT_CATEGORY_NAMES.includes(name)) {
      throw new ApiError(
        400,
        "Category cấp 1 chỉ được là Động vật hoặc Thực vật"
      );
    }

    if (parent && !Types.ObjectId.isValid(parent)) {
      throw new ApiError(400, "Parent category không hợp lệ");
    }

    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        throw new ApiError(404, "Không tìm thấy parent category");
      }
    }

    const category = await Category.create({
      name,
      slug,
      description,
      parent: parent ?? null,
      image
    });

    res.status(201).json({ category });
  }
);
