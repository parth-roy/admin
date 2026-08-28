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

export function useFleetOwnerWalletCredit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note: string }) =>
      fleetApi.walletCredit(id, amount, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fleet'] });
    },
  });
}

export function useSoftDeleteFleetOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => fleetApi.softDelete(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fleet'] });
    },
  });
}

export function useHardDeleteFleetOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => fleetApi.hardDelete(id, reason),
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

