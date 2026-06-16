import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "ObjectId không hợp lệ");
const idOrSlug = z.string().min(1);

const addressSchema = z.object({
  recipientName: z.string().trim().min(2),
  phone: z.string().trim().min(8).max(20),
  addressLine: z.string().trim().min(5),
  city: z.string().trim().min(2),
  isDefault: z.boolean().optional().default(false)
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8),
    phone: z.string().trim().optional(),
    addresses: z.array(addressSchema).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1)
  })
});

export const categorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    slug: z.string().trim().min(2).optional(),
    description: z.string().trim().optional(),
    parent: objectId.nullish(),
    image: z.string().trim().url().optional()
  })
});

export const listBooksSchema = z.object({
  query: z.object({
    category: z.string().trim().optional(),
    search: z.string().trim().optional(),
    sort: z
      .enum(["newest", "price_asc", "price_desc", "featured"])
      .optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
  })
});

export const bookParamsSchema = z.object({
  params: z.object({ id: idOrSlug })
});

const bookPayload = z.object({
  title: z.string().trim().min(2).max(220),
  slug: z.string().trim().min(2).optional(),
  author: z.string().trim().min(2),
  publisher: z.string().trim().optional(),
  description: z.string().trim().min(10),
  price: z.number().min(0),
  discountPrice: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0),
  images: z.array(z.string().trim()).optional().default([]),
  category: objectId,
  tags: z.array(z.string().trim()).optional().default([]),
  isbn: z.string().trim().optional(),
  language: z.string().trim().optional().default("vi"),
  pages: z.number().int().positive().optional(),
  publishedYear: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional().default(false)
});

export const createBookSchema = z.object({ body: bookPayload });

export const updateBookSchema = z.object({
  params: z.object({ id: idOrSlug }),
  body: bookPayload.partial().refine((value) => Object.keys(value).length > 0, {
    message: "Cần ít nhất một field để cập nhật"
  })
});

export const addCartItemSchema = z.object({
  body: z.object({
    book: objectId,
    quantity: z.number().int().min(1)
  })
});

export const cartItemParamsSchema = z.object({
  params: z.object({ itemId: objectId })
});

export const updateCartItemSchema = z.object({
  params: z.object({ itemId: objectId }),
  body: z.object({ quantity: z.number().int().min(1) })
});

const orderItemSchema = z.object({
  book: objectId,
  quantity: z.number().int().min(1)
});

const shippingAddressSchema = addressSchema.omit({ isDefault: true });

export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1).optional(),
    shippingAddress: shippingAddressSchema,
    shippingFee: z.number().min(0).optional().default(0),
    paymentMethod: z.literal("COD").optional().default("COD")
  })
});

export const orderParamsSchema = z.object({
  params: z.object({ id: objectId })
});

export const updateOrderStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    orderStatus: z.enum([
      "pending",
      "confirmed",
      "shipping",
      "delivered",
      "cancelled"
    ]),
    paymentStatus: z.enum(["pending", "paid", "failed"]).optional()
  })
});

export const createReviewSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).optional()
  })
});

export const listReviewsSchema = z.object({
  params: z.object({ id: objectId })
});
