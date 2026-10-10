import { useQuery } from '@tanstack/react-query';
import { driverBidsApi } from '@/lib/api/driver-bids.api';
import type { DriverBidsParams } from '@/lib/api/types';

export const DRIVER_BIDS_KEYS = {
  all: ['driver-bids'] as const,
  list: (params: DriverBidsParams) => ['driver-bids', 'list', params] as const,
  detail: (id: string) => ['driver-bids', 'detail', id] as const,
};

export function useDriverBids(params: DriverBidsParams = {}) {
  return useQuery({
    queryKey: DRIVER_BIDS_KEYS.list(params),
    queryFn: () => driverBidsApi.list(params),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useDriverBid(id: string) {
  return useQuery({
    queryKey: DRIVER_BIDS_KEYS.detail(id),
    queryFn: () => driverBidsApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
