import apiClient from './client';
import type { ApiResponse, AuthTokens, AdminUser } from './types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthTokens> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/admin/auth/login', { email, password });
    return res.data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/admin/auth/logout', { refreshToken });
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/admin/auth/refresh', { refreshToken });
    return res.data.data;
  },

  me: async (): Promise<AdminUser> => {
    const res = await apiClient.get<ApiResponse<AdminUser>>('/admin/auth/me');
    return res.data.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/admin/auth/forgot-password', { email });
    return res.data.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/admin/auth/reset-password', { token, newPassword });
    return res.data.data;
  },
};
