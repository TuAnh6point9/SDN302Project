import apiClient from './client';
import type { ICategory, ICategoryCreatePayload } from '../types';

export const categoryApi = {
  getCategories: async (): Promise<ICategory[]> => {
    const { data } = await apiClient.get('/api/categories');
    return data.categories;
  },

  createCategory: async (payload: ICategoryCreatePayload): Promise<ICategory> => {
    const { data } = await apiClient.post('/api/categories', payload);
    return data.category;
  },
};
