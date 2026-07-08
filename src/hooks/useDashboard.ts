import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard.api';

export const DASHBOARD_KEYS = {
  stats: ['dashboard', 'stats'] as const,
  revenueTrend: (days: number) => ['dashboard', 'revenue-trend', days] as const,
  alerts: ['dashboard', 'alerts'] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.stats,
    queryFn: dashboardApi.getStats,
    staleTime: 60_000, // 1 min — dashboard doesn't need to be real-time
    refetchInterval: 120_000, // auto-refresh every 2 min
  });
}

export function useRevenueTrend(days = 30) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.revenueTrend(days),
    queryFn: () => dashboardApi.getRevenueTrend(days),
    staleTime: 5 * 60_000,
  });
}

export function useDashboardAlerts() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.alerts,
    queryFn: dashboardApi.getAlerts,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
