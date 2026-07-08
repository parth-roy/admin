import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api/bookings.api';
import type { BookingsParams } from '@/lib/api/types';

export const BOOKING_KEYS = {
  all: ['bookings'] as const,
  list: (params: BookingsParams) => ['bookings', 'list', params] as const,
  detail: (id: string) => ['bookings', 'detail', id] as const,
};

export function useBookings(params: BookingsParams = {}) {
  return useQuery({
    queryKey: BOOKING_KEYS.list(params),
    queryFn: () => bookingsApi.list(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // keep previous data while loading next page
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: BOOKING_KEYS.detail(id),
    queryFn: () => bookingsApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useAssignDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, driverId }: { bookingId: string; driverId: string }) =>
      bookingsApi.assignDriver(bookingId, driverId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: BOOKING_KEYS.detail(vars.bookingId) });
      qc.invalidateQueries({ queryKey: BOOKING_KEYS.all });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      bookingsApi.cancel(bookingId, reason),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: BOOKING_KEYS.detail(vars.bookingId) });
      qc.invalidateQueries({ queryKey: BOOKING_KEYS.all });
    },
  });
}

export function useRefundBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, amount, note }: { bookingId: string; amount: number; note: string }) =>
      bookingsApi.refund(bookingId, amount, note),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: BOOKING_KEYS.detail(vars.bookingId) });
    },
  });
}
