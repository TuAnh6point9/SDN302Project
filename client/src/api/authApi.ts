import apiClient from './client';
import type { IAuthResponse, ILoginPayload, IRegisterPayload, IUpdateProfilePayload, IUser } from '../types';

export const authApi = {
  login: async (payload: ILoginPayload): Promise<IAuthResponse> => {
    const { data } = await apiClient.post('/api/auth/login', payload);
    return data;
  },

  register: async (payload: IRegisterPayload): Promise<IAuthResponse> => {
    const { data } = await apiClient.post('/api/auth/register', payload);
    return data;
  },

  getMe: async (): Promise<IUser> => {
    const { data } = await apiClient.get('/api/auth/me');
    return data.user;
  },

  updateMe: async (payload: IUpdateProfilePayload): Promise<IUser> => {
    const { data } = await apiClient.put('/api/auth/me', payload);
    return data.user;
  },

  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await apiClient.put('/api/auth/password', payload);
  },
};
