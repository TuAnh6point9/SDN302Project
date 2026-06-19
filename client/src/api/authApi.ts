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

  forgotPassword: async (email: string): Promise<string> => {
    const { data } = await apiClient.post('/api/auth/forgot-password', { email });
    return data.message;
  },

  resetPassword: async (payload: { token: string; newPassword: string }): Promise<string> => {
    const { data } = await apiClient.post('/api/auth/reset-password', payload);
    return data.message;
  },

  verifyGoogleOtp: async (payload: { email: string; otp: string }): Promise<IAuthResponse> => {
    const { data } = await apiClient.post('/api/auth/google/verify-otp', payload);
    return data;
  },

  resendGoogleOtp: async (email: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/api/auth/google/resend-otp', { email });
    return data;
  },
};
