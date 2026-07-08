import apiClient from './client';
import type { ApiResponse, VehicleTypePricing, Announcement, VehicleType } from './types';

type BroadcastTarget = 'ALL' | 'CUSTOMERS' | 'DRIVERS' | 'FLEET_OWNERS' | 'SPECIFIC';
type NotificationType = 'BOOKING_STATUS' | 'PAYMENT' | 'PROMO' | 'SYSTEM';

export const platformApi = {
  // ── Pricing ────────────────────────────────────────────────────────────────
  listPricing: async (): Promise<VehicleTypePricing[]> => {
    const res = await apiClient.get<ApiResponse<VehicleTypePricing[]>>('/admin/pricing');
    return res.data.data;
  },

  updatePricing: async (vehicleType: VehicleType, data: Partial<VehicleTypePricing>): Promise<VehicleTypePricing> => {
    const res = await apiClient.patch<ApiResponse<VehicleTypePricing>>(`/admin/pricing/${vehicleType}`, data);
    return res.data.data;
  },

  // ── Announcements ─────────────────────────────────────────────────────────
  listAnnouncements: async (): Promise<Announcement[]> => {
    const res = await apiClient.get<ApiResponse<Announcement[]>>('/admin/announcements');
    return res.data.data;
  },

  createAnnouncement: async (data: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    const res = await apiClient.post<ApiResponse<Announcement>>('/admin/announcements', data);
    return res.data.data;
  },

  updateAnnouncement: async (id: string, data: Partial<Announcement>): Promise<Announcement> => {
    const res = await apiClient.patch<ApiResponse<Announcement>>(`/admin/announcements/${id}`, data);
    return res.data.data;
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/announcements/${id}`);
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  broadcastNotification: async (data: {
    title: string;
    body: string;
    target: BroadcastTarget;
    type: NotificationType;
    referenceId?: string;
    targetUserId?: string;
  }): Promise<{ targeted: number; sent: number }> => {
    const res = await apiClient.post<ApiResponse<{ targeted: number; sent: number }>>('/admin/notifications/broadcast', data);
    return res.data.data;
  },
};
