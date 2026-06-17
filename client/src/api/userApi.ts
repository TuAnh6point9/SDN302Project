import apiClient from './client';
import type { IUser, UserRole } from '../types';

export const userApi = {
  getUsers: async (): Promise<IUser[]> => {
    const { data } = await apiClient.get('/api/users');
    return data.users;
  },

  updateUser: async (
    id: string,
    payload: { role?: UserRole; isActive?: boolean }
  ): Promise<IUser> => {
    const { data } = await apiClient.put(`/api/users/${id}`, payload);
    return data.user;
  },
};
