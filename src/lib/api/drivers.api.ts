import apiClient from './client';
import type { ApiResponse, Paginated, DriverListItem, DriverDetail, DriverDocument, VerificationLog, DriversParams } from './types';

export const driversApi = {
  list: async (params: DriversParams = {}): Promise<Paginated<DriverListItem>> => {
    const res = await apiClient.get<ApiResponse<Paginated<DriverListItem>>>('/admin/drivers', { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<DriverDetail> => {
    const res = await apiClient.get<ApiResponse<DriverDetail>>(`/admin/drivers/${id}`);
    return res.data.data;
  },

  updateDocStatus: async (
    driverId: string,
    docId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectedReason?: string
  ): Promise<DriverDocument> => {
    const res = await apiClient.patch<ApiResponse<DriverDocument>>(
      `/admin/drivers/${driverId}/documents/${docId}/status`,
      { status, rejectedReason }
    );
    return res.data.data;
  },

  setDocVerified: async (driverId: string, isDocVerified: boolean): Promise<{ success: boolean }> => {
    const res = await apiClient.patch<ApiResponse<{ success: boolean }>>(`/admin/drivers/${driverId}/doc-verified`, { isDocVerified });
    return res.data.data;
  },

  getVerificationLogs: async (driverId: string): Promise<VerificationLog[]> => {
    const res = await apiClient.get<ApiResponse<VerificationLog[]>>(`/admin/drivers/${driverId}/verification-logs`);
    return res.data.data;
  },

  block: async (driverId: string, isActive: boolean): Promise<{ blocked: boolean; driverId: string }> => {
    const res = await apiClient.patch<ApiResponse<{ blocked: boolean; driverId: string }>>(`/admin/drivers/${driverId}/block`, { isActive });
    return res.data.data;
  },

  overrideStatus: async (driverId: string, status: 'OFFLINE' | 'AVAILABLE' | 'BREAK'): Promise<DriverListItem> => {
    const res = await apiClient.patch<ApiResponse<DriverListItem>>(`/admin/drivers/${driverId}/status-override`, { status });
    return res.data.data;
  },

  walletCredit: async (driverId: string, amount: number, note: string): Promise<{ credited: number; newBalance: number }> => {
    const res = await apiClient.post<ApiResponse<{ credited: number; newBalance: number }>>(`/admin/users/${driverId}/wallet-credit`, { amount, note });
    return res.data.data;
  },

  softDelete: async (id: string, reason: string): Promise<{ deleted: boolean }> => {
    const res = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/admin/drivers/${id}/soft`, { data: { reason } });
    return res.data.data;
  },

  hardDelete: async (id: string, reason: string): Promise<{ deleted: boolean; permanent: boolean }> => {
    const res = await apiClient.delete<ApiResponse<{ deleted: boolean; permanent: boolean }>>(`/admin/drivers/${id}/hard`, { data: { reason } });
    return res.data.data;
  },
};

