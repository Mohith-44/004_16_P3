import axios from 'axios';
import type {
  AnalyticsOverviewResponse,
  AppNotification,
  Department,
  HandlerAvailability,
  HandlerProfile,
  Report,
  ReportSummaryStats,
  RoutingRule,
  User,
} from '../types/index.ts';

export const TOKEN_STORAGE_KEY = 'hwad_auth_token';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    return Promise.reject(error);
  }
);

export function extractApiError(error: unknown, fallback = 'Request failed. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

// Auth API
export const authApi = {
  login: (payload: { email: string; password: string }) =>
    api.post<{ success: boolean; token: string; user: User; handlerProfile?: HandlerProfile | null }>(
      '/auth/login',
      payload
    ),
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
    ward?: string;
    phone?: string;
  }) =>
    api.post<{ success: boolean; token: string; user: User; handlerProfile?: HandlerProfile | null }>(
      '/auth/register',
      payload
    ),
  me: () =>
    api.get<{ success: boolean; user: User; handlerProfile?: HandlerProfile | null }>('/auth/me'),
  updateProfile: (payload: Partial<User>) =>
    api.put<{ success: boolean; user: User; message: string }>('/auth/profile', payload),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.put<{ success: boolean; message: string }>('/auth/password', payload),
};

// Reports API
export const reportsApi = {
  create: (payload: Record<string, unknown>) =>
    api.post<{ success: boolean; message: string; report: Report }>('/reports', payload),
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<{
      success: boolean;
      reports: Report[];
      summary: ReportSummaryStats;
      pagination: { total: number; page: number; limit: number; pages: number };
    }>('/reports', { params }),
  getById: (id: string) => api.get<{ success: boolean; report: Report }>(`/reports/${id}`),
  track: (reportId: string) =>
    api.get<{ success: boolean; report: Report }>(`/reports/track/${encodeURIComponent(reportId)}`),
  update: (id: string, payload: Record<string, unknown>) =>
    api.put<{ success: boolean; message: string; report: Report }>(`/reports/${id}`, payload),
  updateStatus: (
    id: string,
    payload: { status: string; resolutionNotes?: string; remarks?: string; assignedHandler?: string }
  ) =>
    api.patch<{ success: boolean; message: string; report: Report }>(`/reports/${id}/status`, payload),
};

// Handlers API
export const handlersApi = {
  list: (params?: Record<string, string | undefined>) =>
    api.get<{ success: boolean; handlers: HandlerProfile[] }>('/handlers', { params }),
  create: (payload: Record<string, unknown>) =>
    api.post<{ success: boolean; handler: HandlerProfile; message: string }>('/handlers', payload),
  update: (id: string, payload: Record<string, unknown>) =>
    api.put<{ success: boolean; handler: HandlerProfile; message: string }>(`/handlers/${id}`, payload),
  updateAvailability: (id: string, availability: HandlerAvailability) =>
    api.patch<{ success: boolean; handler: HandlerProfile; message: string }>(
      `/handlers/${id}/availability`,
      { availability }
    ),
  updateCapacity: (id: string, maxCapacity: number) =>
    api.patch<{ success: boolean; handler: HandlerProfile; message: string }>(`/handlers/${id}/capacity`, {
      maxCapacity,
    }),
};

// Departments API
export const departmentsApi = {
  list: () => api.get<{ success: boolean; departments: Department[] }>('/departments'),
  create: (payload: Partial<Department>) =>
    api.post<{ success: boolean; department: Department; message: string }>('/departments', payload),
  update: (id: string, payload: Partial<Department>) =>
    api.put<{ success: boolean; department: Department; message: string }>(`/departments/${id}`, payload),
  remove: (id: string) => api.delete<{ success: boolean; message: string }>(`/departments/${id}`),
};

// Routing API
export const routingApi = {
  list: (params?: Record<string, string | undefined>) =>
    api.get<{ success: boolean; rules: RoutingRule[] }>('/routing', { params }),
  create: (payload: Record<string, unknown>) =>
    api.post<{ success: boolean; rule: RoutingRule; message: string }>('/routing', payload),
  update: (id: string, payload: Record<string, unknown>) =>
    api.put<{ success: boolean; rule: RoutingRule; message: string }>(`/routing/${id}`, payload),
  remove: (id: string) => api.delete<{ success: boolean; message: string }>(`/routing/${id}`),
};

// Analytics API
export const analyticsApi = {
  overview: (params?: Record<string, string | undefined>) =>
    api.get<{ success: boolean } & AnalyticsOverviewResponse>('/analytics/overview', { params }),
  categories: (params?: Record<string, string | undefined>) =>
    api.get<{ success: boolean; categories: Array<{ category: string; count: number; resolved: number }> }>(
      '/analytics/categories',
      { params }
    ),
  zones: (params?: Record<string, string | undefined>) =>
    api.get<{ success: boolean; zones: Array<{ zone: string; count: number; critical: number; resolved: number }> }>(
      '/analytics/zones',
      { params }
    ),
  status: (params?: Record<string, string | undefined>) =>
    api.get<{ success: boolean; statuses: Array<{ status: string; count: number }> }>('/analytics/status', {
      params,
    }),
};

// Notifications API
export const notificationsApi = {
  list: () =>
    api.get<{ success: boolean; notifications: AppNotification[]; unreadCount: number }>('/notifications'),
  markRead: (id: string) => api.patch<{ success: boolean }>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ success: boolean }>('/notifications/read-all'),
};

export default api;
