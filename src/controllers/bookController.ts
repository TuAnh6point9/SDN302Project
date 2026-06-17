import { Request, Response } from "express";
import { FilterQuery, Types } from "mongoose";
import { Book, IBook } from "../models/Book";
import { Category } from "../models/Category";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination } from "../utils/pagination";
import { toSlug } from "../utils/slug";

const resolveCategoryIds = async (category?: string) => {
  if (!category) return undefined;

  const categoryDoc = Types.ObjectId.isValid(category)
    ? await Category.findById(category)
    : await Category.findOne({ slug: category });

  if (!categoryDoc) {
    throw new ApiError(404, "Không tìm thấy danh mục");
  }

  const children = await Category.find({ parent: categoryDoc._id }).select("_id");
  return [categoryDoc._id, ...children.map((child) => child._id)];
};

const findBookByIdOrSlug = async (idOrSlug: string) => {
  if (Types.ObjectId.isValid(idOrSlug)) {
    return Book.findById(idOrSlug).populate("category", "name slug parent");
  }

  return Book.findOne({ slug: idOrSlug }).populate("category", "name slug parent");
};

export const getBooks = asyncHandler(async (req: Request, res: Response) => {
  const { category, search, sort, tag, minPrice, maxPrice, inStock, minRating } = req.query;
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);

  const filter: FilterQuery<IBook> = {};
  const categoryIds = await resolveCategoryIds(category as string | undefined);

  if (categoryIds) {
    filter.category = { $in: categoryIds };
  }

  if (search) {
    filter.$text = { $search: String(search) };
  }

  if (tag) {
    filter.tags = String(tag);
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (minPrice !== undefined) priceFilter.$gte = Number(minPrice);
    if (maxPrice !== undefined) priceFilter.$lte = Number(maxPrice);
    filter.$or = [
      { discountPrice: priceFilter },
      { discountPrice: { $exists: false }, price: priceFilter }
    ];
  }

  const shouldFilterInStock = inStock === "true" || String(inStock) === "true";
  if (shouldFilterInStock) {
    filter.stockQuantity = { $gt: 0 };
  }

  if (minRating !== undefined) {
    filter.ratingAverage = { $gte: Number(minRating) };
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    featured: { isFeatured: -1, createdAt: -1 }
  };

  const sortOption = search
    ? { score: { $meta: "textScore" } }
    : sortMap[String(sort ?? "newest")];

  const [books, total] = await Promise.all([
    Book.find(filter)
      .populate("category", "name slug parent")
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Book.countDocuments(filter)
  ]);

  res.json({
    books,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const getBookById = asyncHandler(async (req: Request, res: Response) => {
  const book = await findBookByIdOrSlug(req.params.id);

  if (!book) {
    throw new ApiError(404, "Không tìm thấy sách");
  }

  res.json({ book });
});

export const createBook = asyncHandler(async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    slug: req.body.slug ? toSlug(req.body.slug) : toSlug(req.body.title)
  };

  const category = await Category.findById(payload.category);
  if (!category || !category.parent) {
    throw new ApiError(400, "Sách phải thuộc danh mục con của Động vật hoặc Thực vật");
  }

  const book = await Book.create(payload);
  res.status(201).json({ book });
});

export const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const update = { ...req.body };
  if (update.title && !update.slug) {
    update.slug = toSlug(update.title);
  } else if (update.slug) {
    update.slug = toSlug(update.slug);
  }

  if (update.category) {
    const category = await Category.findById(update.category);
    if (!category || !category.parent) {
      throw new ApiError(400, "Sách phải thuộc danh mục con của Động vật hoặc Thực vật");
    }
  }

  const query = Types.ObjectId.isValid(req.params.id)
    ? { _id: req.params.id }
    : { slug: req.params.id };

  const book = await Book.findOneAndUpdate(query, update, {
    new: true,
    runValidators: true
  });

  if (!book) {
    throw new ApiError(404, "Không tìm thấy sách");
  }

  res.json({ book });
});

export const deleteBook = asyncHandler(async (req: Request, res: Response) => {
  const query = Types.ObjectId.isValid(req.params.id)
    ? { _id: req.params.id }
    : { slug: req.params.id };

  const book = await Book.findOneAndDelete(query);

  if (!book) {
    throw new ApiError(404, "Không tìm thấy sách");
  }

  res.json({ message: "Đã xóa sách" });
});
