import apiClient from './client';
import type { INotification } from '../types';

export const notificationApi = {
  getNotifications: async (): Promise<{ notifications: INotification[]; unreadCount: number }> => {
    const { data } = await apiClient.get('/api/notifications');
    return data;
  },

  markRead: async (): Promise<void> => {
    await apiClient.put('/api/notifications/read');
  },
};
