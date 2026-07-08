import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformApi } from '@/lib/api/platform.api';
import { auditApi } from '@/lib/api/audit.api';
import type { VehicleType } from '@/lib/api/types';

export const PLATFORM_KEYS = {
  pricing: ['platform', 'pricing'] as const,
  announcements: ['platform', 'announcements'] as const,
  systemHealth: ['platform', 'health'] as const,
  ulipLogs: (params: any) => ['platform', 'ulip-logs', params] as const,
};

// ── Pricing ───────────────────────────────────────────────────────────────────
export function usePricing() {
  return useQuery({
    queryKey: PLATFORM_KEYS.pricing,
    queryFn: platformApi.listPricing,
    staleTime: 5 * 60_000,
  });
}

export function useUpdatePricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleType, data }: { vehicleType: VehicleType; data: any }) =>
      platformApi.updatePricing(vehicleType, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLATFORM_KEYS.pricing }),
  });
}

// ── Announcements ─────────────────────────────────────────────────────────────
export function useAnnouncements() {
  return useQuery({
    queryKey: PLATFORM_KEYS.announcements,
    queryFn: platformApi.listAnnouncements,
    staleTime: 5 * 60_000,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: platformApi.createAnnouncement,
    onSuccess: () => qc.invalidateQueries({ queryKey: PLATFORM_KEYS.announcements }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => platformApi.updateAnnouncement(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLATFORM_KEYS.announcements }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformApi.deleteAnnouncement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLATFORM_KEYS.announcements }),
  });
}

// ── Broadcast Notification ────────────────────────────────────────────────────
export function useBroadcastNotification() {
  return useMutation({ mutationFn: platformApi.broadcastNotification });
}

// ── ULIP Logs ─────────────────────────────────────────────────────────────────
export function useUlipLogs(params: any = {}) {
  return useQuery({
    queryKey: PLATFORM_KEYS.ulipLogs(params),
    queryFn: () => auditApi.listUlipLogs(params),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

// ── System Health ─────────────────────────────────────────────────────────────
export function useSystemHealth() {
  return useQuery({
    queryKey: PLATFORM_KEYS.systemHealth,
    queryFn: auditApi.getSystemHealth,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
