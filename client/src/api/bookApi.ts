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

  getBestSellerIds: async (): Promise<string[]> => {
    const { data } = await apiClient.get('/api/books/best-sellers');
    return data.bookIds;
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

  exportCsv: async (): Promise<Blob> => {
    const { data } = await apiClient.get('/api/books/admin/export', {
      responseType: 'blob',
    });
    return data;
  },

  importCsv: async (csv: string): Promise<{ importedCount: number; imported: string[]; errors: string[] }> => {
    const { data } = await apiClient.post('/api/books/admin/import', { csv });
    return data;
  },
};
