import apiClient from './client';
import type { IBooksResponse, IBooksQueryParams, IBook, IBookCreatePayload, IBookUpdatePayload } from '../types';

export const bookApi = {
  getBooks: async (params?: IBooksQueryParams): Promise<IBooksResponse> => {
    const { data } = await apiClient.get('/api/books', { params });
    return data;
  },

  getBookBySlug: async (slug: string): Promise<IBook> => {
    const { data } = await apiClient.get(`/api/books/${slug}`);
    return data.book;
  },

  createBook: async (payload: IBookCreatePayload): Promise<IBook> => {
    const { data } = await apiClient.post('/api/books', payload);
    return data.book;
  },

  updateBook: async (id: string, payload: IBookUpdatePayload): Promise<IBook> => {
    const { data } = await apiClient.put(`/api/books/${id}`, payload);
    return data.book;
  },

  deleteBook: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/books/${id}`);
  },
};
