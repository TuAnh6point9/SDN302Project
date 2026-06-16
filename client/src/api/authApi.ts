import apiClient from './client';
import type { IAuthResponse, ILoginPayload, IUser } from '../types';

export const authApi = {
  login: async (payload: ILoginPayload): Promise<IAuthResponse> => {
    const { data } = await apiClient.post('/api/auth/login', payload);
    return data;
  },

  getMe: async (): Promise<IUser> => {
    const { data } = await apiClient.get('/api/auth/me');
    return data.user;
  },
};
