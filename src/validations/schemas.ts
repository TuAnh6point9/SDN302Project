import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "ObjectId khong hop le");
const idOrSlug = z.string().min(1);
const queryBoolean = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

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

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      phone: z.string().trim().optional(),
      avatar: z.string().trim().optional(),
      addresses: z.array(addressSchema).optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Can it nhat mot field de cap nhat"
    })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8)
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email().toLowerCase()
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().trim().min(20),
    newPassword: z.string().min(8)
  })
});

export const userParamsSchema = z.object({
  params: z.object({ id: objectId })
});

export const updateUserSchema = z.object({
  body: z
    .object({
      role: z.enum(["customer", "admin"]).optional(),
      isActive: z.boolean().optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Can it nhat mot field de cap nhat"
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
    tag: z.string().trim().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    inStock: queryBoolean.optional(),
    stockStatus: z.enum(["all", "in_stock", "low_stock", "out_of_stock"]).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
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
    message: "Can it nhat mot field de cap nhat"
  })
});

export const createVoucherSchema = z.object({
  body: z.object({
    code: z.string().trim().min(3).max(40),
    type: z.enum(["percent", "fixed"]),
    value: z.number().min(0),
    minOrderValue: z.number().min(0).optional().default(0),
    maxDiscount: z.number().min(0).optional(),
    usageLimit: z.number().int().positive().optional(),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
    isActive: z.boolean().optional().default(true)
  })
});

export const updateVoucherSchema = z.object({
  params: z.object({
    code: z.string().trim().min(3).max(40)
  }),
  body: createVoucherSchema.shape.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: "Can it nhat mot field de cap nhat"
  })
});

export const voucherCodeSchema = z.object({
  params: z.object({
    code: z.string().trim().min(3).max(40)
  })
});

export const validateVoucherSchema = z.object({
  params: z.object({
    code: z.string().trim().min(3).max(40)
  }),
  query: z.object({
    subtotal: z.coerce.number().min(0)
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

export const wishlistParamsSchema = z.object({
  params: z.object({ bookId: objectId })
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
    voucherCode: z.string().trim().optional(),
    paymentMethod: z.enum(["COD", "ONLINE"]).optional().default("COD")
  })
});

export const orderParamsSchema = z.object({
  params: z.object({ id: objectId })
});

export const payosOrderParamsSchema = z.object({
  params: z.object({ orderId: objectId })
});

export const listAdminOrdersSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    orderStatus: z
      .enum(["pending", "confirmed", "shipping", "delivered", "cancelled", "all"])
      .optional(),
    paymentStatus: z.enum(["pending", "paid", "failed", "all"]).optional(),
    paymentMethod: z.enum(["COD", "ONLINE", "all"]).optional(),
    dateFrom: z.string().trim().optional(),
    dateTo: z.string().trim().optional()
  })
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
    paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
    note: z.string().trim().max(500).optional(),
    cancelReason: z.string().trim().max(500).optional()
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

export const reviewParamsSchema = z.object({
  params: z.object({ reviewId: objectId })
});
