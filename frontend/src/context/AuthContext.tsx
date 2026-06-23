"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  id: number;
  nickname: string;
  rating: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (nickname: string, password: string) => Promise<{ success: boolean; message?: string; code?: string }>;
  register: (nickname: string, password: string) => Promise<{ success: boolean; message?: string; code?: string }>;
  logout: () => void;
  updateRating: (newRating: number) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  updateRating: () => {},
  isLoading: true,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const STORAGE_KEY = "16a0_auth";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { token: t, user: u } = JSON.parse(stored);
        setToken(t);
        setUser(u);
      }
    } catch {}
    setIsLoading(false);
  }, []);

  const persist = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    } catch {}
  };

  const login = useCallback(async (nickname: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message, code: data.code };
      persist(data.token, data.user);
      return { success: true };
    } catch {
      return { success: false, code: "connection_error", message: "Erro de conexão com o servidor." };
    }
  }, []);

  const register = useCallback(async (nickname: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message, code: data.code };
      persist(data.token, data.user);
      return { success: true };
    } catch {
      return { success: false, code: "connection_error", message: "Erro de conexão com o servidor." };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const updateRating = useCallback((newRating: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, rating: newRating };
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, user: updated }));
        }
      } catch {}
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateRating, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
