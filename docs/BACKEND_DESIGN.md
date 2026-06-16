# GreenLeaf Books - Backend Design

## Tech Stack

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Backend runtime | Node.js | Chạy server |
| Web framework | Express.js + TypeScript | Xây REST API |
| Database | MongoDB | Lưu dữ liệu sách, đơn hàng, giỏ hàng |
| ODM | Mongoose | Schema, validation, query, transaction |
| DB hosting | MongoDB Atlas | Cluster cloud cho dev/staging/production |
| DB GUI | MongoDB Compass | Xem/sửa dữ liệu, không nằm trong dependency code |
| Auth | JWT + bcrypt | Đăng ký/đăng nhập, hash password |
| Validation | Zod | Validate body/query/params |
| Upload ảnh | Multer 2.x | Upload ảnh bìa sách local MVP |
| Frontend giả định | React + TypeScript + TailwindCSS | UI tiếng Việt |

## UI Guideline

| Vai trò | Hex | Dùng cho |
|---|---|---|
| Primary | `#2E7D32` | Nút chính, link, accent |
| Primary Light | `#81C784` | Hover, badge, highlight |
| Primary Dark | `#1B5E20` | Header/footer, nút active |
| Background | `#F5F5F0` | Nền off-white ấm |
| Text | `#1A1A1A` / `#424242` | Văn bản |
| Accent phụ | `#A1887F` | Điểm nhấn nâu đất |

Font đề xuất: Inter hoặc Poppins cho heading, Inter/Nunito Sans cho body. Icon đề xuất: `lucide-react` với `Leaf`, `PawPrint`, `Sprout`, `TreePine`.

## Category

Chỉ có 2 category cấp 1:

- `Động vật`: Động vật có vú, Chim, Bò sát & Lưỡng cư, Côn trùng & Động vật không xương sống, Sinh vật biển
- `Thực vật`: Thực vật học đại cương, Cây cảnh & Làm vườn, Cây thuốc/Thảo dược, Sinh thái rừng

Model dùng `parent?: ObjectId | null` để render menu đa cấp. Controller không cho tạo root category khác hai tên trên.

## Models

### User

```ts
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "customer" | "admin";
  phone?: string;
  addresses: {
    recipientName: string;
    phone: string;
    addressLine: string;
    city: string;
    isDefault: boolean;
  }[];
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

`passwordHash` dùng `select: false` và bị loại khỏi `toJSON`, nên API không trả password/plain text.

### Category

```ts
export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parent?: Types.ObjectId | null;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Book

```ts
export interface IBook extends Document {
  title: string;
  slug: string;
  author: string;
  publisher?: string;
  description: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  images: string[];
  category: Types.ObjectId;
  tags: string[];
  isbn?: string;
  language: string;
  pages?: number;
  publishedYear?: number;
  ratingAverage: number;
  numReviews: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Index:

```ts
bookSchema.index({ title: "text", author: "text", tags: "text" });
bookSchema.index({ category: 1, price: 1 });
```

### Cart

```ts
export interface ICart extends Document {
  user: Types.ObjectId;
  items: {
    _id: Types.ObjectId;
    book: Types.ObjectId;
    quantity: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Order

```ts
export interface IOrder extends Document {
  orderCode: string;
  user: Types.ObjectId;
  items: {
    book: Types.ObjectId;
    title: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingAddress: {
    recipientName: string;
    phone: string;
    addressLine: string;
    city: string;
  };
  paymentMethod: "COD";
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}
```

Khi tạo order, `services/orderService.ts` dùng MongoDB transaction. Mỗi item cập nhật bằng điều kiện `stockQuantity >= quantity`; nếu sách không đủ tồn, transaction rollback. `Order.items.title` và `Order.items.price` là snapshot tại thời điểm mua.

### Review

```ts
export interface IReview extends Document {
  user: Types.ObjectId;
  book: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Index:

```ts
reviewSchema.index({ user: 1, book: 1 }, { unique: true });
```

## Routes & Controllers

| Module | Route file | Controller |
|---|---|---|
| Auth | `src/routes/authRoutes.ts` | `src/controllers/authController.ts` |
| Books | `src/routes/bookRoutes.ts` | `src/controllers/bookController.ts` |
| Categories | `src/routes/categoryRoutes.ts` | `src/controllers/categoryController.ts` |
| Cart | `src/routes/cartRoutes.ts` | `src/controllers/cartController.ts` |
| Orders | `src/routes/orderRoutes.ts` | `src/controllers/orderController.ts` |
| Reviews | `src/routes/bookRoutes.ts` | `src/controllers/reviewController.ts` |
| Uploads | `src/routes/uploadRoutes.ts` | Multer local upload |

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/books?category=&search=&sort=&page=`
- `GET /api/books/:id`
- `POST /api/books` `(admin)`
- `PUT /api/books/:id` `(admin)`
- `DELETE /api/books/:id` `(admin)`
- `GET /api/categories`
- `POST /api/categories` `(admin)`
- `GET /api/cart`
- `POST /api/cart`
- `PUT /api/cart/:itemId`
- `DELETE /api/cart/:itemId`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/all` `(admin)`
- `GET /api/orders/:id`
- `PUT /api/orders/:id/status` `(admin)`
- `POST /api/books/:id/reviews`
- `GET /api/books/:id/reviews`
- `POST /api/uploads/books` `(admin, multipart image)`

## MongoDB Atlas + Compass

1. Tạo free tier cluster trên MongoDB Atlas.
2. Tạo database user có quyền đọc/ghi.
3. Whitelist IP cho dev, có thể dùng `0.0.0.0/0` trong môi trường học tập.
4. Lấy connection string dạng:

```txt
mongodb+srv://<user>:<password>@cluster.mongodb.net/greenleaf_books
```

5. Lưu vào `.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/greenleaf_books
```

6. Dùng MongoDB Compass kết nối cùng connection string để xem/sửa dữ liệu. Compass không phải dependency trong `package.json`.

## Frontend Pages

- Home
- Danh sách sách với filter sidebar
- Chi tiết sách
- Giỏ hàng
- Checkout chỉ COD
- Đăng nhập/Đăng ký
- Trang cá nhân và lịch sử đơn hàng
- Admin Dashboard

## Roadmap

Phase 1 MVP đã triển khai:

- Auth JWT + bcrypt
- Book CRUD, listing, filter, search text index
- Category tree 2 nhóm gốc
- Cart
- Order COD với transaction chống oversell
- Upload ảnh bìa bằng Multer local

Phase 2 định hướng:

- Review/rating nâng cao
- Admin dashboard thống kê
- Wishlist
- Search nâng cao

Không triển khai online payment ở bất kỳ phase nào.
