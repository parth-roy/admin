import apiClient from './client';
import type {
  ApiResponse,
  Paginated,
  VerificationLog,
  AdminDispatchAlertItem,
  DriverEngagementAuditItem,
  DispatchAlertSeverity,
  DriverActionType,
} from './types';

interface UlipLogsParams {
  entityType?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface DispatchAlertsParams {
  page?: number;
  limit?: number;
  isResolved?: 'true' | 'false' | 'all';
  severity?: DispatchAlertSeverity;
}

export interface DisintermediationFeedParams {
  page?: number;
  limit?: number;
  action?: DriverActionType;
  driverId?: string;
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

  // ── Dispatch SLA & Anti-Disintermediation Alerts ─────────────────────────────
  getDispatchAlerts: async (params: DispatchAlertsParams = {}): Promise<Paginated<AdminDispatchAlertItem>> => {
    const res = await apiClient.get<ApiResponse<AdminDispatchAlertItem[]>>('/telemetry/dispatch-alerts', { params });
    return {
      data: res.data.data,
      total: (res.data as any).meta?.total ?? res.data.data.length,
      page: (res.data as any).meta?.page ?? (params.page || 1),
      limit: (res.data as any).meta?.limit ?? (params.limit || 50),
    };
  },

  resolveDispatchAlert: async (id: string, notes?: string): Promise<AdminDispatchAlertItem> => {
    const res = await apiClient.patch<ApiResponse<AdminDispatchAlertItem>>(`/telemetry/dispatch-alerts/${id}/resolve`, { notes });
    return res.data.data;
  },

  getDisintermediationFeed: async (params: DisintermediationFeedParams = {}): Promise<Paginated<DriverEngagementAuditItem>> => {
    const res = await apiClient.get<ApiResponse<DriverEngagementAuditItem[]>>('/telemetry/disintermediation-feed', { params });
    return {
      data: res.data.data,
      total: (res.data as any).meta?.total ?? res.data.data.length,
      page: (res.data as any).meta?.page ?? (params.page || 1),
      limit: (res.data as any).meta?.limit ?? (params.limit || 50),
    };
  },
};
