import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fleetApi } from '@/lib/api/fleet.api';
import type { FleetParams } from '@/lib/api/types';

export const FLEET_KEYS = {
  owners: (params: FleetParams) => ['fleet', 'owners', params] as const,
  ownerDetail: (id: string) => ['fleet', 'owner-detail', id] as const,
  trucks: (params: FleetParams) => ['fleet', 'trucks', params] as const,
  expiring: (days: number) => ['fleet', 'expiring', days] as const,
};

export function useFleetOwners(params: FleetParams = {}) {
  return useQuery({
    queryKey: FLEET_KEYS.owners(params),
    queryFn: () => fleetApi.listOwners(params),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useFleetOwner(id: string) {
  return useQuery({
    queryKey: FLEET_KEYS.ownerDetail(id),
    queryFn: () => fleetApi.getOwnerById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useSetFleetOwnerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isVerified?: boolean; isActive?: boolean } }) =>
      fleetApi.setOwnerStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fleet'] });
    },
  });
}

export function useFleetTrucks(params: FleetParams = {}) {
  return useQuery({
    queryKey: FLEET_KEYS.trucks(params),
    queryFn: () => fleetApi.listTrucks(params),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useExpiringTrucks(days = 30) {
  return useQuery({
    queryKey: FLEET_KEYS.expiring(days),
    queryFn: () => fleetApi.getExpiringTrucks(days),
    staleTime: 5 * 60_000,
  });
}
