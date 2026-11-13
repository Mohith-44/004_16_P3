import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, TOKEN_STORAGE_KEY } from '../services/api.ts';
import type { HandlerProfile, User } from '../types/index.ts';

interface AuthContextValue {
  user: User | null;
  handlerProfile: HandlerProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
    ward?: string;
    phone?: string;
  }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setHandlerProfile: React.Dispatch<React.SetStateAction<HandlerProfile | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [handlerProfile, setHandlerProfile] = useState<HandlerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setUser(null);
      setHandlerProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await authApi.me();
      setUser(data.user);
      setHandlerProfile(data.handlerProfile || null);
    } catch {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
      setHandlerProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { data } = await authApi.login({ email, password });
    if (!data?.token || !data?.user) {
      throw new Error('Authentication service returned an invalid response. Please try again.');
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setUser(data.user);
    setHandlerProfile(data.handlerProfile || null);
    return data.user;
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      role: string;
      department?: string;
      ward?: string;
      phone?: string;
    }): Promise<User> => {
      const { data } = await authApi.register(payload);
      if (!data?.token || !data?.user) {
        throw new Error('Registration service returned an invalid response. Please try again.');
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setUser(data.user);
      setHandlerProfile(data.handlerProfile || null);
      return data.user;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setHandlerProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        handlerProfile,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser,
        setUser,
        setHandlerProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
