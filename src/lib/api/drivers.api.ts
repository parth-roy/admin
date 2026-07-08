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
};
