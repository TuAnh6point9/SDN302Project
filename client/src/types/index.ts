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
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IAuthResponse {
  user: IUser;
  token: string;
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
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'featured';
}
