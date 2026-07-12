import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { authApi } from '../api';
import { setAuthToken } from '../api/client';
import { IUser } from '../types/models';

const TOKEN_KEY = 'greenleaf_token';
const USER_KEY = 'greenleaf_user';

interface AuthContextType {
  user: IUser | null;
  isLoading: boolean;
  login: (user: IUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: IUser) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [token, savedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (token && savedUser) {
          setAuthToken(token);
          setUserState(JSON.parse(savedUser));
          // Làm mới thông tin user (điểm thưởng, trạng thái khóa) ở nền
          authApi.getMe().then(setUser).catch(() => {});
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setUser = (u: IUser) => {
    setUserState(u);
    AsyncStorage.setItem(USER_KEY, JSON.stringify(u)).catch(() => {});
  };

  const login = async (u: IUser, token: string) => {
    setAuthToken(token);
    setUserState(u);
    await AsyncStorage.multiSet([[TOKEN_KEY, token], [USER_KEY, JSON.stringify(u)]]);
  };

  const logout = async () => {
    setAuthToken(null);
    setUserState(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  };

  const refreshUser = async () => {
    const me = await authApi.getMe();
    setUser(me);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
