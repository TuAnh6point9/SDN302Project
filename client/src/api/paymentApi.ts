import apiClient from './client';
import type { IOrder, IPaymentTransaction } from '../types';

export const paymentApi = {
  createPayosPayment: async (orderId: string): Promise<{ order: IOrder; payment: IPaymentTransaction }> => {
    const { data } = await apiClient.post(`/api/payments/payos/orders/${orderId}/create`);
    return data;
  },
};
