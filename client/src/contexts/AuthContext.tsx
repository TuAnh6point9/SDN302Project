import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '../api/authApi';
import type { IUser, ILoginPayload } from '../types';

interface AuthContextType {
  user: IUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (payload: ILoginPayload) => Promise<void>;
  logout: () => void;
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

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('greenleaf_token');
        localStorage.removeItem('greenleaf_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (payload: ILoginPayload) => {
    const { user: loggedInUser, token } = await authApi.login(payload);
    localStorage.setItem('greenleaf_token', token);
    localStorage.setItem('greenleaf_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('greenleaf_token');
    localStorage.removeItem('greenleaf_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, logout }}>
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
