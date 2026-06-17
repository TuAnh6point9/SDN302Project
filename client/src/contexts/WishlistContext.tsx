/* eslint-disable react-hooks/set-state-in-effect, react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { wishlistApi } from '../api/wishlistApi';
import { useAuth } from './AuthContext';
import type { IBook } from '../types';

interface WishlistContextType {
  wishlist: IBook[];
  wishlistIds: Set<string>;
  isLoading: boolean;
  refreshWishlist: () => Promise<void>;
  addToWishlist: (bookId: string) => Promise<void>;
  removeFromWishlist: (bookId: string) => Promise<void>;
  toggleWishlist: (bookId: string) => Promise<boolean>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<IBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }

    setIsLoading(true);
    try {
      const nextWishlist = await wishlistApi.getWishlist();
      setWishlist(nextWishlist);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshWishlist();
  }, [refreshWishlist]);

  const addToWishlist = useCallback(async (bookId: string) => {
    const nextWishlist = await wishlistApi.add(bookId);
    setWishlist(nextWishlist);
  }, []);

  const removeFromWishlist = useCallback(async (bookId: string) => {
    const nextWishlist = await wishlistApi.remove(bookId);
    setWishlist(nextWishlist);
  }, []);

  const wishlistIds = useMemo(
    () => new Set(wishlist.map((book) => book._id)),
    [wishlist]
  );

  const toggleWishlist = useCallback(async (bookId: string) => {
    if (wishlistIds.has(bookId)) {
      await removeFromWishlist(bookId);
      return false;
    }

    await addToWishlist(bookId);
    return true;
  }, [addToWishlist, removeFromWishlist, wishlistIds]);

  const value = useMemo<WishlistContextType>(() => ({
    wishlist,
    wishlistIds,
    isLoading,
    refreshWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
  }), [addToWishlist, isLoading, refreshWishlist, removeFromWishlist, toggleWishlist, wishlist, wishlistIds]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
