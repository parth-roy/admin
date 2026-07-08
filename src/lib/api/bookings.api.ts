import apiClient, { API_BASE_URL } from "./client";
import type {
  ApiResponse,
  Paginated,
  BookingListItem,
  BookingDetail,
  BookingsParams,
} from "./types";

export const bookingsApi = {
  list: async (params: BookingsParams = {}): Promise<Paginated<BookingListItem>> => {
    const res = await apiClient.get<ApiResponse<Paginated<BookingListItem>>>("/admin/bookings", {
      params,
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<BookingDetail> => {
    const res = await apiClient.get<ApiResponse<BookingDetail>>(`/admin/bookings/${id}`);
    return res.data.data;
  },

  assignDriver: async (bookingId: string, driverId: string): Promise<BookingDetail> => {
    const res = await apiClient.post<ApiResponse<BookingDetail>>(
      `/admin/bookings/${bookingId}/assign-driver`,
      { driverId },
    );
    return res.data.data;
  },

  cancel: async (bookingId: string, reason: string): Promise<BookingDetail> => {
    const res = await apiClient.post<ApiResponse<BookingDetail>>(
      `/admin/bookings/${bookingId}/cancel`,
      { reason },
    );
    return res.data.data;
  },

  refund: async (
    bookingId: string,
    amount: number,
    note: string,
  ): Promise<{ refunded: number; newBalance: number }> => {
    const res = await apiClient.post<ApiResponse<{ refunded: number; newBalance: number }>>(
      `/admin/bookings/${bookingId}/refund`,
      { amount, note },
    );
    return res.data.data;
  },

  exportCsv: (): string => {
    const token = localStorage.getItem("parther_admin_access_token");
    return `${API_BASE_URL}/admin/bookings/export?token=${token}`;
  },
};
