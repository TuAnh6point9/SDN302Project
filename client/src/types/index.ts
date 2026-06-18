// ─── Book ────────────────────────────────────────────────────────────────────

export interface IBook {
  _id: string;
  title: string;
  slug: string;
  author: string;
  publisher?: string;
  description: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  images: string[];
  category: ICategory | string;
  tags: string[];
  isbn?: string;
  language: string;
  pages?: number;
  publishedYear?: number;
  ratingAverage: number;
  numReviews: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IBookCreatePayload {
  title: string;
  author: string;
  publisher?: string;
  description: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  images: string[];
  category: string;
  tags: string[];
  isbn?: string;
  language?: string;
  pages?: number;
  publishedYear?: number;
  isFeatured?: boolean;
}

export type IBookUpdatePayload = Partial<IBookCreatePayload>;

// ─── Category ────────────────────────────────────────────────────────────────

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string | null;
  image?: string;
  children?: ICategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ICategoryCreatePayload {
  name: string;
  description?: string;
  parent?: string | null;
  image?: string;
}

// ─── User / Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'admin';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  addresses?: IUserAddress[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUserAddress {
  _id?: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  isDefault?: boolean;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface IUpdateProfilePayload {
  name?: string;
  phone?: string;
  avatar?: string;
  addresses?: IUserAddress[];
}

export interface IAuthResponse {
  user: IUser;
  token: string;
}

// Cart / Order

export interface ICartItem {
  _id: string;
  book: IBook;
  quantity: number;
}

export interface ICart {
  _id: string;
  user: string;
  items: ICartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface IShippingAddress {
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
}

export type PaymentMethod = 'COD' | 'ONLINE';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

export interface IOrderItem {
  book: string;
  title: string;
  price: number;
  quantity: number;
}

export interface IOrder {
  _id: string;
  orderCode: string;
  user: IUser | string;
  items: IOrderItem[];
  subtotal: number;
  discountTotal: number;
  voucherCode?: string;
  shippingFee: number;
  total: number;
  shippingAddress: IShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  cancelReason?: string;
  statusHistory?: IOrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface IOrderStatusHistory {
  status: OrderStatus;
  note?: string;
  changedBy?: string | Pick<IUser, '_id' | 'name' | 'email'>;
  changedAt: string;
}

export interface ICreateOrderPayload {
  items?: Array<{ book: string; quantity: number }>;
  shippingAddress: IShippingAddress;
  shippingFee?: number;
  voucherCode?: string;
  paymentMethod?: PaymentMethod;
}

export interface IPaymentTransaction {
  id: string;
  provider: 'payos';
  providerOrderCode: number;
  paymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  amount: number;
  description: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED';
}

export type VoucherType = 'percent' | 'fixed';

export interface IVoucher {
  _id: string;
  code: string;
  type: VoucherType;
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IReview {
  _id: string;
  user: Pick<IUser, '_id' | 'name' | 'avatar'>;
  book: string | Pick<IBook, '_id' | 'title' | 'slug'>;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  audience: 'user' | 'admin';
  type: 'order' | 'payment' | 'inventory' | 'system';
  title: string;
  message: string;
  link?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IInventoryMovement {
  _id: string;
  book: Pick<IBook, '_id' | 'title' | 'slug' | 'stockQuantity'> | string;
  type: 'import' | 'adjustment' | 'sale' | 'return';
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  note?: string;
  createdBy?: Pick<IUser, '_id' | 'name' | 'email'>;
  createdAt: string;
  updatedAt: string;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IBooksResponse {
  books: IBook[];
  pagination: IPagination;
}

export interface IBooksQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  minRating?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'featured';
}
