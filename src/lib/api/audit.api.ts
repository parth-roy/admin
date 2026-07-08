import apiClient from './client';
import type { ApiResponse, Paginated, VerificationLog } from './types';

interface UlipLogsParams {
  entityType?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const auditApi = {
  listUlipLogs: async (params: UlipLogsParams = {}): Promise<Paginated<VerificationLog>> => {
    const res = await apiClient.get<ApiResponse<Paginated<VerificationLog>>>('/admin/ulip-logs', { params });
    return res.data.data;
  },

  getUlipLogById: async (id: string): Promise<VerificationLog> => {
    const res = await apiClient.get<ApiResponse<VerificationLog>>(`/admin/ulip-logs/${id}`);
    return res.data.data;
  },

  getSystemHealth: async (): Promise<{ status: string; database: { status: string; latencyMs: number }; mockUlip: boolean }> => {
    const res = await apiClient.get('/admin/system/health');
    return res.data.data;
  },
};
