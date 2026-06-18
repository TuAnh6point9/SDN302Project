import { Request, Response } from "express";
import { Book } from "../models/Book";
import { Category } from "../models/Category";
import { InventoryMovement } from "../models/InventoryMovement";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { toSlug } from "../utils/slug";

const csvEscape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
};

export const exportBooksCsv = asyncHandler(async (_req: Request, res: Response) => {
  const books = await Book.find().populate("category", "name slug").sort({ createdAt: -1 });
  const header = [
    "title",
    "author",
    "publisher",
    "category",
    "price",
    "discountPrice",
    "stockQuantity",
    "tags",
    "isbn",
    "language",
    "pages",
    "publishedYear",
    "isFeatured",
    "description"
  ];

  const rows = books.map((book) => {
    const category = typeof book.category === "object" && "slug" in book.category
      ? (book.category as unknown as { slug: string }).slug
      : String(book.category);

    return [
      book.title,
      book.author,
      book.publisher ?? "",
      category,
      book.price,
      book.discountPrice ?? "",
      book.stockQuantity,
      book.tags.join("|"),
      book.isbn ?? "",
      book.language,
      book.pages ?? "",
      book.publishedYear ?? "",
      book.isFeatured,
      book.description
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  res.header("Content-Type", "text/csv; charset=utf-8");
  res.attachment(`greenleaf-books-${new Date().toISOString().slice(0, 10)}.csv`);
  res.send(csv);
});

export const importBooksCsv = asyncHandler(async (req: Request, res: Response) => {
  const csv = String(req.body.csv ?? "");
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new ApiError(400, "File CSV khong co du lieu");
  }

  const headers = parseCsvLine(lines[0]).map((cell) => cell.trim());
  const imported: string[] = [];
  const errors: string[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = parseCsvLine(lines[index]);
    const row = headers.reduce<Record<string, string>>((result, header, cellIndex) => {
      result[header] = values[cellIndex]?.trim() ?? "";
      return result;
    }, {});

    try {
      const category = await Category.findOne({
        $or: [{ slug: row.category }, { name: row.category }]
      });

      if (!category || !category.parent) {
        throw new Error("Danh muc khong hop le");
      }

      const stockQuantity = Number(row.stockQuantity || 0);
      const existingBook = await Book.findOne({ slug: toSlug(row.title) });
      const quantityBefore = existingBook?.stockQuantity ?? 0;

      const book = existingBook ?? new Book();
      book.set({
        title: row.title,
        slug: toSlug(row.title),
        author: row.author,
        publisher: row.publisher || undefined,
        description: row.description,
        price: Number(row.price || 0),
        discountPrice: row.discountPrice ? Number(row.discountPrice) : undefined,
        stockQuantity,
        category: category._id,
        tags: row.tags ? row.tags.split("|").map((tag) => tag.trim()).filter(Boolean) : [],
        isbn: row.isbn || undefined,
        language: row.language || "vi",
        pages: row.pages ? Number(row.pages) : undefined,
        publishedYear: row.publishedYear ? Number(row.publishedYear) : undefined,
        isFeatured: row.isFeatured === "true",
        images: book.images ?? []
      });
      await book.save();

      if (quantityBefore !== stockQuantity) {
        await InventoryMovement.create({
          book: book._id,
          type: "import",
          quantityChange: stockQuantity - quantityBefore,
          quantityBefore,
          quantityAfter: stockQuantity,
          note: "Import CSV",
          createdBy: req.user!._id
        });
      }

      imported.push(book.title);
    } catch (error) {
      errors.push(`Dong ${index + 1}: ${error instanceof Error ? error.message : "Khong the import"}`);
    }
  }

  res.json({ importedCount: imported.length, imported, errors });
});
