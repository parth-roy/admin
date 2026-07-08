import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '@/lib/api/drivers.api';
import type { DriversParams } from '@/lib/api/types';

export const DRIVER_KEYS = {
  all: ['drivers'] as const,
  list: (params: DriversParams) => ['drivers', 'list', params] as const,
  detail: (id: string) => ['drivers', 'detail', id] as const,
  verifLogs: (id: string) => ['drivers', 'verif-logs', id] as const,
};

export function useDrivers(params: DriversParams = {}) {
  return useQuery({
    queryKey: DRIVER_KEYS.list(params),
    queryFn: () => driversApi.list(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: DRIVER_KEYS.detail(id),
    queryFn: () => driversApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useDriverVerifLogs(id: string) {
  return useQuery({
    queryKey: DRIVER_KEYS.verifLogs(id),
    queryFn: () => driversApi.getVerificationLogs(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateDocStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      driverId,
      docId,
      status,
      rejectedReason,
    }: {
      driverId: string;
      docId: string;
      status: 'VERIFIED' | 'REJECTED';
      rejectedReason?: string;
    }) => driversApi.updateDocStatus(driverId, docId, status, rejectedReason),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: DRIVER_KEYS.detail(vars.driverId) });
    },
  });
}

export function useSetDocVerified() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, isDocVerified }: { driverId: string; isDocVerified: boolean }) =>
      driversApi.setDocVerified(driverId, isDocVerified),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: DRIVER_KEYS.detail(vars.driverId) });
      qc.invalidateQueries({ queryKey: DRIVER_KEYS.all });
    },
  });
}
