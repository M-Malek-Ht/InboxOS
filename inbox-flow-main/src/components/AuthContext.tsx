import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (provider: 'google' | 'microsoft') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3000' : '/api');

// Refresh 5 minutes before the 1-hour token expires
const REFRESH_INTERVAL_MS = 55 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      fetch(`${API_URL}/auth/refresh`, { credentials: 'include' })
        .then((res) => { if (res.ok) scheduleRefresh(); })
        .catch(() => {});
    }, REFRESH_INTERVAL_MS);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        if (data) scheduleRefresh();
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));

    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, [scheduleRefresh]);

  const login = useCallback((provider: 'google' | 'microsoft') => {
    window.location.href = `${API_URL}/auth/${provider}`;
  }, []);

  const logout = useCallback(() => {
    window.location.href = `${API_URL}/auth/logout`;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
