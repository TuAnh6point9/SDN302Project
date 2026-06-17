import apiClient from './client';
import type { IVoucher } from '../types';

export const voucherApi = {
  validate: async (
    code: string,
    subtotal: number
  ): Promise<{ discountTotal: number; voucherCode?: string }> => {
    const { data } = await apiClient.get(`/api/vouchers/validate/${code}`, {
      params: { subtotal },
    });
    return data;
  },

  getVouchers: async (): Promise<IVoucher[]> => {
    const { data } = await apiClient.get('/api/vouchers');
    return data.vouchers;
  },

  createVoucher: async (payload: Omit<IVoucher, '_id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<IVoucher> => {
    const { data } = await apiClient.post('/api/vouchers', payload);
    return data.voucher;
  },
};
