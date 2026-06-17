import apiClient from './client';
import type { IBook } from '../types';

export const wishlistApi = {
  getWishlist: async (): Promise<IBook[]> => {
    const { data } = await apiClient.get('/api/wishlist');
    return data.wishlist;
  },

  add: async (bookId: string): Promise<IBook[]> => {
    const { data } = await apiClient.post(`/api/wishlist/${bookId}`);
    return data.wishlist;
  },

  remove: async (bookId: string): Promise<IBook[]> => {
    const { data } = await apiClient.delete(`/api/wishlist/${bookId}`);
    return data.wishlist;
  },
};
