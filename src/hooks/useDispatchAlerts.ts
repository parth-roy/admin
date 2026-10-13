import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditApi, type DispatchAlertsParams, type DisintermediationFeedParams } from '@/lib/api/audit.api';

export const ALERT_KEYS = {
  allAlerts: ['dispatch-alerts'] as const,
  alertsList: (params: DispatchAlertsParams) => ['dispatch-alerts', 'list', params] as const,
  allTelemetry: ['telemetry-feed'] as const,
  telemetryList: (params: DisintermediationFeedParams) => ['telemetry-feed', 'list', params] as const,
};

export function useDispatchAlerts(params: DispatchAlertsParams = {}) {
  return useQuery({
    queryKey: ALERT_KEYS.alertsList(params),
    queryFn: () => auditApi.getDispatchAlerts(params),
    refetchInterval: 15_000, // Live poll every 15 seconds
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}

export function useResolveDispatchAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      auditApi.resolveDispatchAlert(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ALERT_KEYS.allAlerts });
    },
  });
}

export function useDisintermediationFeed(params: DisintermediationFeedParams = {}) {
  return useQuery({
    queryKey: ALERT_KEYS.telemetryList(params),
    queryFn: () => auditApi.getDisintermediationFeed(params),
    refetchInterval: 20_000, // Live poll every 20 seconds
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}
