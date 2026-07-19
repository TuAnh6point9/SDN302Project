import apiClient from './client';

export interface IRevenuePoint {
  day: string;
  revenue: number;
  orders: number;
}

export interface ITopBook {
  title: string;
  quantity: number;
  revenue: number;
}

export interface IAdminOverview {
  revenueByDay: IRevenuePoint[];
  topBooks: ITopBook[];
  ordersByStatus: { status: string; count: number }[];
  totals: {
    deliveredRevenue: number;
    deliveredOrders: number;
    totalOrders: number;
    customers: number;
  };
}

export const statsApi = {
  getAdminOverview: async (): Promise<IAdminOverview> => {
    const { data } = await apiClient.get('/api/stats/admin/overview');
    return data;
  },
};
