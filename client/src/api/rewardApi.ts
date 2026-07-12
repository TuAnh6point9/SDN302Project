import apiClient from './client';
import type { IRewardHistoryItem, IRewardStatus, IRewardSummary, IUser, IVoucher } from '../types';

export const rewardApi = {
  getStatus: async (): Promise<IRewardStatus> => {
    const { data } = await apiClient.get('/api/rewards/status');
    return data;
  },

  claim: async (): Promise<{ message: string; user: IUser; rewardPoints: number }> => {
    const { data } = await apiClient.post('/api/rewards/claim');
    return data;
  },

  getHistory: async (): Promise<{ history: IRewardHistoryItem[] }> => {
    const { data } = await apiClient.get('/api/rewards/history');
    return data;
  },

  redeem: async (points: number): Promise<{ message: string; user: IUser; voucher: IVoucher }> => {
    const { data } = await apiClient.post('/api/rewards/redeem', { points });
    return data;
  },

  getAdminSummary: async (): Promise<IRewardSummary> => {
    const { data } = await apiClient.get('/api/rewards/admin/summary');
    return data;
  },

  getAdminHistory: async (limit = 50): Promise<{ history: IRewardHistoryItem[] }> => {
    const { data } = await apiClient.get(`/api/rewards/admin/history?limit=${limit}`);
    return data;
  },
};
