import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Role, User } from '@/types/api';
import { api } from '@/services';
import { getUserFromToken } from '@/services/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => api.getToken());
  const [user, setUser] = useState<User | null>(() => {
    const existingToken = api.getToken();
    const tokenUser = existingToken ? getUserFromToken(existingToken) : null;
    const stored = api.getStoredUser();
    if (stored && tokenUser && (stored.user_ref_id === tokenUser.user_ref_id || stored.email === tokenUser.email)) {
      return stored;
    }
    return tokenUser;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      api.setSession(res.token, res.user);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isAuthenticated: !!token && !!user, loading, login, logout }),
    [user, token, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRole(): Role | null {
  return useAuth().user?.role ?? null;
}
