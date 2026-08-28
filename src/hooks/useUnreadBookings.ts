import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api/bookings.api";
import type { BookingListItem } from "@/lib/api/types";

const STORAGE_KEY = "parther_admin_seen_booking_ids";
const SYNC_EVENT = "parther_admin_seen_bookings_updated";

function getStoredSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function persistSeenIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch (e) {
    console.error("Failed to save seen booking IDs:", e);
  }
}

export function useUnreadBookings() {
  const [seenIds, setSeenIds] = useState<Set<string>>(() => getStoredSeenIds());

  useEffect(() => {
    const handleSync = () => {
      setSeenIds(getStoredSeenIds());
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Fetch the latest 50 bookings periodically (every 15 seconds)
  const { data, refetch } = useQuery({
    queryKey: ["unreadBookingsCheck"],
    queryFn: async () => {
      const res = await bookingsApi.list({ page: 1, limit: 50 });
      return res;
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const bookings = useMemo<BookingListItem[]>(() => {
    return data?.data ?? [];
  }, [data]);

  const unreadBookings = useMemo(() => {
    return bookings.filter((b) => !seenIds.has(b.id));
  }, [bookings, seenIds]);

  const unreadCount = unreadBookings.length;

  const isBookingUnread = useCallback(
    (id: string) => {
      return !seenIds.has(id);
    },
    [seenIds]
  );

  const markAsSeen = useCallback((id: string) => {
    if (!id) return;
    const current = getStoredSeenIds();
    if (!current.has(id)) {
      current.add(id);
      persistSeenIds(current);
      setSeenIds(new Set(current));
    }
  }, []);

  const markMultipleAsSeen = useCallback((ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const current = getStoredSeenIds();
    let changed = false;
    ids.forEach((id) => {
      if (!current.has(id)) {
        current.add(id);
        changed = true;
      }
    });
    if (changed) {
      persistSeenIds(current);
      setSeenIds(new Set(current));
    }
  }, []);

  const markAllAsSeen = useCallback(() => {
    if (bookings.length === 0) return;
    const current = getStoredSeenIds();
    bookings.forEach((b) => current.add(b.id));
    persistSeenIds(current);
    setSeenIds(new Set(current));
  }, [bookings]);

  return {
    unreadCount,
    unreadBookings,
    isBookingUnread,
    markAsSeen,
    markMultipleAsSeen,
    markAllAsSeen,
    refetch,
  };
}
