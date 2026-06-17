import apiClient from './client';
import type { ICreateOrderPayload, IOrder, OrderStatus, PaymentStatus } from '../types';

export const orderApi = {
  createOrder: async (payload: ICreateOrderPayload): Promise<IOrder> => {
    const { data } = await apiClient.post('/api/orders', payload);
    return data.order;
  },

  getMyOrders: async (): Promise<IOrder[]> => {
    const { data } = await apiClient.get('/api/orders');
    return data.orders;
  },

  getAllOrders: async (): Promise<IOrder[]> => {
    const { data } = await apiClient.get('/api/orders/all');
    return data.orders;
  },

  getOrderById: async (id: string): Promise<IOrder> => {
    const { data } = await apiClient.get(`/api/orders/${id}`);
    return data.order;
  },

  payOnlineDemo: async (id: string): Promise<IOrder> => {
    const { data } = await apiClient.put(`/api/orders/${id}/pay-online-demo`);
    return data.order;
  },

  updateStatus: async (
    id: string,
    payload: {
      orderStatus: OrderStatus;
      paymentStatus?: PaymentStatus;
      note?: string;
      cancelReason?: string;
    }
  ): Promise<IOrder> => {
    const { data } = await apiClient.put(`/api/orders/${id}/status`, payload);
    return data.order;
  },
};
