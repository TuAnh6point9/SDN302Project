import apiClient from './client';
import type { IReview } from '../types';

export const reviewApi = {
  getBookReviews: async (bookId: string): Promise<IReview[]> => {
    const { data } = await apiClient.get(`/api/books/${bookId}/reviews`);
    return data.reviews;
  },

  createReview: async (
    bookId: string,
    payload: { rating: number; comment?: string }
  ): Promise<IReview> => {
    const { data } = await apiClient.post(`/api/books/${bookId}/reviews`, payload);
    return data.review;
  },
};
