import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { notificationsApi } from '../services/api.ts';
import type { AppNotification } from '../types/index.ts';
import { useAuth } from './AuthContext.tsx';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const { data } = await notificationsApi.list();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Fail silently on background refresh
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshNotifications();
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      void refreshNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
