import apiClient from './client';

export const uploadApi = {
  uploadBookImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await apiClient.post('/api/uploads/books', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
};
