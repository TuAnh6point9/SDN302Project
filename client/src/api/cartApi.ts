import apiClient from './client';
import type { ICart } from '../types';

export const cartApi = {
  getCart: async (): Promise<ICart> => {
    const { data } = await apiClient.get('/api/cart');
    return data.cart;
  },

  addItem: async (book: string, quantity: number): Promise<ICart> => {
    const { data } = await apiClient.post('/api/cart', { book, quantity });
    return data.cart;
  },

  updateItem: async (itemId: string, quantity: number): Promise<ICart> => {
    const { data } = await apiClient.put(`/api/cart/${itemId}`, { quantity });
    return data.cart;
  },

  removeItem: async (itemId: string): Promise<ICart> => {
    const { data } = await apiClient.delete(`/api/cart/${itemId}`);
    return data.cart;
  },
};
