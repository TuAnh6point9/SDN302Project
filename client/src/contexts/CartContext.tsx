/* eslint-disable react-hooks/set-state-in-effect, react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { cartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';
import type { ICart } from '../types';

interface CartContextType {
  cart: ICart | null;
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (bookId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearLocalCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getItemPrice = (item: ICart['items'][number]) =>
  item.book.discountPrice ?? item.book.price;

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<ICart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }

    setIsLoading(true);
    try {
      const nextCart = await cartApi.getCart();
      setCart(nextCart);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(async (bookId: string, quantity: number) => {
    const nextCart = await cartApi.addItem(bookId, quantity);
    setCart(nextCart);
  }, []);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    const nextCart = await cartApi.updateItem(itemId, quantity);
    setCart(nextCart);
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    const nextCart = await cartApi.removeItem(itemId);
    setCart(nextCart);
  }, []);

  const clearLocalCart = useCallback(() => {
    setCart((current) => current ? { ...current, items: [] } : current);
  }, []);

  const value = useMemo<CartContextType>(() => {
    const items = cart?.items ?? [];
    return {
      cart,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0),
      isLoading,
      refreshCart,
      addToCart,
      updateQuantity,
      removeItem,
      clearLocalCart,
    };
  }, [addToCart, cart, clearLocalCart, isLoading, refreshCart, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
