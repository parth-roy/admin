import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { manualBookingsApi, ManualBookingsParams, ManualBookingRecord } from "@/lib/api/manual-bookings.api";
import { toast } from "sonner";

export const MANUAL_BOOKING_KEYS = {
  all: ["manual-bookings"] as const,
  list: (params: ManualBookingsParams) => ["manual-bookings", "list", params] as const,
  detail: (id: string) => ["manual-bookings", "detail", id] as const,
  matchedDrivers: (id: string, params: any) => ["manual-bookings", "matched-drivers", id, params] as const,
};

export function useManualBookings(params: ManualBookingsParams = {}) {
  return useQuery({
    queryKey: MANUAL_BOOKING_KEYS.list(params),
    queryFn: () => manualBookingsApi.list(params),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useManualBooking(id: string) {
  return useQuery({
    queryKey: MANUAL_BOOKING_KEYS.detail(id),
    queryFn: () => manualBookingsApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useMatchedDrivers(
  id: string | null,
  params: { radiusKm?: number; vehicleType?: string; search?: string } = {}
) {
  return useQuery({
    queryKey: MANUAL_BOOKING_KEYS.matchedDrivers(id || "", params),
    queryFn: () => manualBookingsApi.getMatchedDrivers(id as string, params),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateManualBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ManualBookingRecord>) => manualBookingsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MANUAL_BOOKING_KEYS.all });
      toast.success("Manual booking created successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create manual booking");
    },
  });
}

export function useUpdateManualBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ManualBookingRecord> }) =>
      manualBookingsApi.update(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: MANUAL_BOOKING_KEYS.detail(vars.id) });
      qc.invalidateQueries({ queryKey: MANUAL_BOOKING_KEYS.all });
      toast.success("Manual booking updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update manual booking");
    },
  });
}

export function useDeleteManualBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => manualBookingsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MANUAL_BOOKING_KEYS.all });
      toast.success("Manual booking deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete manual booking");
    },
  });
}
