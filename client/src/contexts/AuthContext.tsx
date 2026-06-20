/* eslint-disable react-hooks/set-state-in-effect, react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '../api/authApi';
import type { IUser, ILoginPayload, IRegisterPayload, IUpdateProfilePayload } from '../types';

interface AuthContextType {
  user: IUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (payload: ILoginPayload) => Promise<IUser>;
  register: (payload: IRegisterPayload) => Promise<IUser | { otpRequired: boolean; email: string }>;
  updateProfile: (payload: IUpdateProfilePayload) => Promise<IUser>;
  changePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<void>;
  logout: () => void;
  loginWithToken: (token: string, user: IUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('greenleaf_token');
    const savedUser = localStorage.getItem('greenleaf_user');

    if (!token) {
      setIsLoading(false);
      return;
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('greenleaf_token');
        localStorage.removeItem('greenleaf_user');
      }
    }

    authApi.getMe()
      .then((freshUser) => {
        localStorage.setItem('greenleaf_user', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        localStorage.removeItem('greenleaf_token');
        localStorage.removeItem('greenleaf_user');
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: ILoginPayload) => {
    const { user: loggedInUser, token } = await authApi.login(payload);
    localStorage.setItem('greenleaf_token', token);
    localStorage.setItem('greenleaf_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload: IRegisterPayload) => {
    const response = await authApi.register(payload);
    if ('otpRequired' in response) {
      return response;
    }
    const { user: registeredUser, token } = response;
    localStorage.setItem('greenleaf_token', token);
    localStorage.setItem('greenleaf_user', JSON.stringify(registeredUser));
    setUser(registeredUser);
    return registeredUser;
  }, []);

  const updateProfile = useCallback(async (payload: IUpdateProfilePayload) => {
    const updatedUser = await authApi.updateMe(payload);
    localStorage.setItem('greenleaf_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const changePassword = useCallback(async (payload: { currentPassword: string; newPassword: string }) => {
    await authApi.changePassword(payload);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('greenleaf_token');
    localStorage.removeItem('greenleaf_user');
    setUser(null);
  }, []);

  const loginWithToken = useCallback((token: string, loggedInUser: IUser) => {
    localStorage.setItem('greenleaf_token', token);
    localStorage.setItem('greenleaf_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, register, updateProfile, changePassword, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
