import apiClient from './client';
import type { IBook, IInventoryMovement } from '../types';

export const inventoryApi = {
  getMovements: async (): Promise<IInventoryMovement[]> => {
    const { data } = await apiClient.get('/api/inventory');
    return data.movements;
  },

  adjust: async (
    bookId: string,
    payload: {
      mode: 'set' | 'change';
      type: 'import' | 'adjustment' | 'return';
      quantity?: number;
      quantityChange?: number;
      note?: string;
    }
  ): Promise<{ book: IBook; movement: IInventoryMovement }> => {
    const { data } = await apiClient.post(`/api/inventory/${bookId}/adjust`, payload);
    return data;
  },
};
