import apiClient from './client';
import type {
  IAuthResponse, IBook, ICart, ICategory, INotification, IOrder, IPagination,
  IReview, IRewardHistoryItem, IRewardStatus, IShippingAddress, IUser, IVoucher,
  PaymentMethod,
} from '../types/models';

export const authApi = {
  login: async (email: string, password: string): Promise<IAuthResponse> =>
    (await apiClient.post('/api/auth/login', { email, password })).data,
  register: async (payload: { name: string; email: string; password: string; phone?: string }) =>
    (await apiClient.post('/api/auth/register', payload)).data as { otpRequired: boolean; email: string },
  verifyOtp: async (email: string, otp: string): Promise<IAuthResponse> =>
    (await apiClient.post('/api/auth/google/verify-otp', { email, otp })).data,
  resendOtp: async (email: string) =>
    (await apiClient.post('/api/auth/google/resend-otp', { email })).data as { message: string },
  getMe: async (): Promise<IUser> => (await apiClient.get('/api/auth/me')).data.user,
  updateMe: async (payload: Partial<Pick<IUser, 'name' | 'phone' | 'addresses'>>): Promise<IUser> =>
    (await apiClient.put('/api/auth/me', payload)).data.user,
  changePassword: async (currentPassword: string, newPassword: string) => {
    await apiClient.put('/api/auth/password', { currentPassword, newPassword });
  },
  forgotPassword: async (email: string) =>
    (await apiClient.post('/api/auth/forgot-password', { email })).data as { message: string },
};

export interface IBooksQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'featured';
}

export const bookApi = {
  getBooks: async (params?: IBooksQuery): Promise<{ books: IBook[]; pagination: IPagination }> =>
    (await apiClient.get('/api/books', { params })).data,
  getBook: async (idOrSlug: string): Promise<IBook> =>
    (await apiClient.get(`/api/books/${idOrSlug}`)).data.book,
  getBestSellerIds: async (): Promise<string[]> =>
    (await apiClient.get('/api/books/best-sellers')).data.bookIds,
};

export const categoryApi = {
  getCategories: async (): Promise<ICategory[]> =>
    (await apiClient.get('/api/categories')).data.categories,
};

export const cartApi = {
  getCart: async (): Promise<ICart> => (await apiClient.get('/api/cart')).data.cart,
  addItem: async (book: string, quantity: number): Promise<ICart> =>
    (await apiClient.post('/api/cart', { book, quantity })).data.cart,
  updateItem: async (itemId: string, quantity: number): Promise<ICart> =>
    (await apiClient.put(`/api/cart/${itemId}`, { quantity })).data.cart,
  removeItem: async (itemId: string): Promise<ICart> =>
    (await apiClient.delete(`/api/cart/${itemId}`)).data.cart,
};

export const wishlistApi = {
  getWishlist: async (): Promise<IBook[]> => (await apiClient.get('/api/wishlist')).data.wishlist,
  add: async (bookId: string): Promise<IBook[]> =>
    (await apiClient.post(`/api/wishlist/${bookId}`)).data.wishlist,
  remove: async (bookId: string): Promise<IBook[]> =>
    (await apiClient.delete(`/api/wishlist/${bookId}`)).data.wishlist,
};

export const orderApi = {
  createOrder: async (payload: {
    shippingAddress: IShippingAddress;
    shippingFee: number;
    voucherCode?: string;
    paymentMethod: PaymentMethod;
  }): Promise<IOrder> => (await apiClient.post('/api/orders', payload)).data.order,
  getMyOrders: async (): Promise<IOrder[]> => (await apiClient.get('/api/orders')).data.orders,
  getOrderById: async (id: string): Promise<IOrder> =>
    (await apiClient.get(`/api/orders/${id}`)).data.order,
  cancelOrder: async (id: string, cancelReason?: string): Promise<IOrder> =>
    (await apiClient.put(`/api/orders/${id}/cancel`, { cancelReason })).data.order,
};

export const paymentApi = {
  createPayosPayment: async (orderId: string): Promise<{ checkoutUrl?: string }> =>
    (await apiClient.post(`/api/payments/payos/orders/${orderId}/create`)).data.payment ?? {},
};

export const voucherApi = {
  validate: async (code: string, subtotal: number): Promise<{ discountTotal: number; voucherCode?: string }> =>
    (await apiClient.get(`/api/vouchers/validate/${code}`, { params: { subtotal } })).data,
};

export const reviewApi = {
  getBookReviews: async (bookId: string): Promise<IReview[]> =>
    (await apiClient.get(`/api/books/${bookId}/reviews`)).data.reviews,
  createReview: async (bookId: string, rating: number, comment?: string): Promise<IReview> =>
    (await apiClient.post(`/api/books/${bookId}/reviews`, { rating, comment })).data.review,
};

export const rewardApi = {
  getStatus: async (): Promise<IRewardStatus> => (await apiClient.get('/api/rewards/status')).data,
  claim: async (): Promise<{ message: string; user: IUser; rewardPoints: number }> =>
    (await apiClient.post('/api/rewards/claim')).data,
  getHistory: async (): Promise<IRewardHistoryItem[]> =>
    (await apiClient.get('/api/rewards/history')).data.history,
  redeem: async (points: number): Promise<{ message: string; user: IUser; voucher: IVoucher }> =>
    (await apiClient.post('/api/rewards/redeem', { points })).data,
};

export const subscriptionApi = {
  getStatus: async (bookId: string): Promise<{ subscribed: boolean }> =>
    (await apiClient.get(`/api/books/${bookId}/subscribe`)).data,
  subscribe: async (bookId: string): Promise<{ subscribed: boolean }> =>
    (await apiClient.post(`/api/books/${bookId}/subscribe`)).data,
  unsubscribe: async (bookId: string): Promise<{ subscribed: boolean }> =>
    (await apiClient.delete(`/api/books/${bookId}/subscribe`)).data,
};

export const notificationApi = {
  getNotifications: async (): Promise<{ notifications: INotification[]; unreadCount: number }> =>
    (await apiClient.get('/api/notifications')).data,
  markRead: async () => {
    await apiClient.put('/api/notifications/read');
  },
};
