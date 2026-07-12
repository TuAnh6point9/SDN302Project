import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { cartApi } from '../api';
import { ICart } from '../types/models';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: ICart | null;
  totalItems: number;
  refreshCart: () => Promise<void>;
  addItem: (bookId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearLocal: () => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<ICart | null>(null);

  useEffect(() => {
    if (user) {
      cartApi.getCart().then(setCart).catch(() => {});
    } else {
      setCart(null);
    }
  }, [user?._id]);

  const refreshCart = async () => setCart(await cartApi.getCart());
  const addItem = async (bookId: string, quantity: number) =>
    setCart(await cartApi.addItem(bookId, quantity));
  const updateItem = async (itemId: string, quantity: number) =>
    setCart(await cartApi.updateItem(itemId, quantity));
  const removeItem = async (itemId: string) => setCart(await cartApi.removeItem(itemId));
  const clearLocal = () => setCart(null);

  const totalItems = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{ cart, totalItems, refreshCart, addItem, updateItem, removeItem, clearLocal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
