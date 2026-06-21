import apiClient from './client';
import type { ICreateOrderPayload, IOrder, OrderStatus, PaymentMethod, PaymentStatus } from '../types';

export interface IAdminOrdersQuery {
  search?: string;
  orderStatus?: OrderStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  paymentMethod?: PaymentMethod | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export const orderApi = {
  createOrder: async (payload: ICreateOrderPayload): Promise<IOrder> => {
    const { data } = await apiClient.post('/api/orders', payload);
    return data.order;
  },

  getMyOrders: async (): Promise<IOrder[]> => {
    const { data } = await apiClient.get('/api/orders');
    return data.orders;
  },

  getAllOrders: async (params?: IAdminOrdersQuery): Promise<IOrder[]> => {
    const { data } = await apiClient.get('/api/orders/all', { params });
    return data.orders;
  },

  getOrderById: async (id: string): Promise<IOrder> => {
    const { data } = await apiClient.get(`/api/orders/${id}`);
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

  cancelOrder: async (id: string, cancelReason?: string): Promise<IOrder> => {
    const { data } = await apiClient.put(`/api/orders/${id}/cancel`, { cancelReason });
    return data.order;
  },
};
