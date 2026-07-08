import apiClient from './client';
import type { ApiResponse, DashboardStats, RevenueTrendPoint, DashboardAlerts } from './types';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
    return res.data.data;
  },

  getRevenueTrend: async (days = 30): Promise<RevenueTrendPoint[]> => {
    const res = await apiClient.get<ApiResponse<RevenueTrendPoint[]>>('/admin/dashboard/revenue-trend', {
      params: { days },
    });
    return res.data.data;
  },

  getAlerts: async (): Promise<DashboardAlerts> => {
    const res = await apiClient.get<ApiResponse<DashboardAlerts>>('/admin/dashboard/alerts');
    return res.data.data;
  },
};
