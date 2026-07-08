import apiClient from './client';
import type { ApiResponse, Paginated, UserListItem, UserDetail, UsersParams } from './types';

export const usersApi = {
  list: async (params: UsersParams = {}): Promise<Paginated<UserListItem>> => {
    const res = await apiClient.get<ApiResponse<Paginated<UserListItem>>>('/admin/users', { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<UserDetail> => {
    const res = await apiClient.get<ApiResponse<UserDetail>>(`/admin/users/${id}`);
    return res.data.data;
  },

  setStatus: async (id: string, isActive: boolean): Promise<UserListItem> => {
    const res = await apiClient.patch<ApiResponse<UserListItem>>(`/admin/users/${id}/status`, { isActive });
    return res.data.data;
  },

  forceLogout: async (id: string): Promise<{ revokedSessions: number }> => {
    const res = await apiClient.delete<ApiResponse<{ revokedSessions: number }>>(`/admin/users/${id}/sessions`);
    return res.data.data;
  },

  walletCredit: async (id: string, amount: number, note: string): Promise<{ credited: number; newBalance: number }> => {
    const res = await apiClient.post<ApiResponse<{ credited: number; newBalance: number }>>(`/admin/users/${id}/wallet-credit`, { amount, note });
    return res.data.data;
  },
};
