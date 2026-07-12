import apiClient from './client';

export const subscriptionApi = {
  getStatus: async (bookId: string): Promise<{ subscribed: boolean }> => {
    const { data } = await apiClient.get(`/api/books/${bookId}/subscribe`);
    return data;
  },

  subscribe: async (bookId: string): Promise<{ subscribed: boolean }> => {
    const { data } = await apiClient.post(`/api/books/${bookId}/subscribe`);
    return data;
  },

  unsubscribe: async (bookId: string): Promise<{ subscribed: boolean }> => {
    const { data } = await apiClient.delete(`/api/books/${bookId}/subscribe`);
    return data;
  },
};
