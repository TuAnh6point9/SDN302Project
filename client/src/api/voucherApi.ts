import apiClient from './client';
import type { IVoucher } from '../types';

export type IVoucherPayload = Omit<IVoucher, '_id' | 'usedCount' | 'createdAt' | 'updatedAt'>;

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

  createVoucher: async (payload: IVoucherPayload): Promise<IVoucher> => {
    const { data } = await apiClient.post('/api/vouchers', payload);
    return data.voucher;
  },

  updateVoucher: async (code: string, payload: Partial<IVoucherPayload>): Promise<IVoucher> => {
    const { data } = await apiClient.put(`/api/vouchers/${code}`, payload);
    return data.voucher;
  },

  getHomepageEvents: async (): Promise<IVoucher[]> => {
    const { data } = await apiClient.get('/api/vouchers/homepage-event');
    return data.vouchers;
  },
};
