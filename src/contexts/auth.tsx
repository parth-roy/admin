import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api/auth.api';
import { authStorage } from '@/lib/auth';
import type { AdminUser } from '@/lib/api/types';

interface AuthContextValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true on mount while we check token

  // On mount: try to restore session from localStorage
  useEffect(() => {
    const restoreSession = async () => {
      if (!authStorage.isAuthenticated()) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        setAdmin(me);
      } catch {
        // Token expired or invalid — clear and stay unauthenticated
        authStorage.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    authStorage.setTokens(result.accessToken, result.refreshToken);
    setAdmin(result.admin);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = authStorage.getRefreshToken();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch { /* ignore logout errors */ }
    authStorage.clearTokens();
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
