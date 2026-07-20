// Rút gọn từ client/src/types/index.ts — chỉ giữ phần mobile dùng
export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  children?: ICategory[];
}

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
  language: string;
  pages?: number;
  publishedYear?: number;
  ratingAverage: number;
  numReviews: number;
  isFeatured: boolean;
}

export interface IUserAddress {
  _id?: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  isDefault?: boolean;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  isActive: boolean;
  phone?: string;
  addresses?: IUserAddress[];
  avatar?: string;
  points?: number;
}

export interface IAuthResponse {
  user: IUser;
  token: string;
}

export interface ICartItem {
  _id: string;
  book: IBook;
  quantity: number;
}

export interface ICart {
  _id: string;
  items: ICartItem[];
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

export interface IOrderStatusHistory {
  status: OrderStatus;
  note?: string;
  changedAt: string;
}

export interface IOrder {
  _id: string;
  orderCode: string;
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
}

export interface IReview {
  _id: string;
  user: { _id: string; name: string; avatar?: string };
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface IVoucher {
  _id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  expiresAt?: string;
  isActive?: boolean;
}

export type RewardReason = 'daily_login' | 'purchase' | 'review' | 'redeem_voucher' | 'claimed_voucher';

export interface IRewardStatus {
  canClaim: boolean;
  points: number;
  rewardPoints: number;
  today: string;
}

export interface IRewardHistoryItem {
  _id: string;
  points: number;
  day: string;
  reason: RewardReason;
  balanceAfter?: number;
  refId?: string | IVoucher | null;
  createdAt: string;
}

export interface INotification {
  _id: string;
  type: 'order' | 'payment' | 'inventory' | 'system';
  title: string;
  message: string;
  readAt?: string;
  createdAt: string;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
