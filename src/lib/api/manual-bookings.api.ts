import apiClient, { API_BASE_URL } from "./client";
import type { ApiResponse } from "./types";

export interface ManualBookingRecord {
  id: string;
  bookingNumber: string;
  source?: string | null;

  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerCompany?: string | null;
  customerGstin?: string | null;

  receiverName?: string | null;
  receiverPhone?: string | null;

  pickupAddress?: string | null;
  pickupCity?: string | null;
  pickupDistrict?: string | null;
  pickupState?: string | null;
  pickupPincode?: string | null;
  pickupLandmark?: string | null;
  pickupDateTime?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;

  dropoffAddress?: string | null;
  dropoffCity?: string | null;
  dropoffDistrict?: string | null;
  dropoffState?: string | null;
  dropoffPincode?: string | null;
  dropoffLandmark?: string | null;
  dropoffDateTime?: string | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;

  estimatedDistanceKm?: number | null;
  routeDescription?: string | null;

  vehicleType?: string | null;
  vehicleNumber?: string | null;
  truckCount?: number | null;
  bodyType?: string | null;

  driverName?: string | null;
  driverPhone?: string | null;
  driverDlNumber?: string | null;
  transporterName?: string | null;
  transporterPhone?: string | null;

  goodsType?: string | null;
  goodsDescription?: string | null;
  goodsWeightKg?: number | null;
  goodsWeightTons?: number | null;
  goodsQuantity?: number | null;
  goodsDeclaredValue?: number | null;
  handlingInstructions?: string | null;

  quotedAmount?: number | null;
  driverPayoutAmount?: number | null;
  advanceReceived?: number | null;
  balanceAmount?: number | null;
  paymentStatus?: string | null;
  paymentMode?: string | null;
  invoiceNumber?: string | null;

  status?: string | null;
  notes?: string | null;
  createdByAdminId?: string | null;
  createdByAdminName?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface ManualBookingsListResponse {
  data: ManualBookingRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    totalBookings: number;
    totalQuotedRevenue: number;
    totalAdvanceReceived: number;
    inTransitCount: number;
    confirmedCount: number;
  };
}

export interface ManualBookingsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  vehicleType?: string;
  source?: string;
  pickupCity?: string;
  dropoffCity?: string;
  pickupState?: string;
  dropoffState?: string;
  startDate?: string;
  endDate?: string;
}

export interface MatchedDriverLead {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  city: string;
  state: string | null;
  transportHub: string | null;
  vehicleType: string;
  vehicleNumber: string;
  distanceKm: number;
  tier: "LOCAL" | "REGIONAL" | "CORRIDOR" | "EXTENDED";
  isExactVehicleMatch: boolean;
  matchScore: number;
  notes: string | null;
  status: string;
  createdAt: string;
}

export interface MatchedDriversResponse {
  booking: {
    id: string;
    bookingNumber: string;
    customerName?: string | null;
    customerPhone?: string | null;
    pickupCity?: string | null;
    pickupAddress?: string | null;
    dropoffCity?: string | null;
    dropoffAddress?: string | null;
    vehicleType?: string | null;
    goodsType?: string | null;
    quotedAmount?: number | null;
    pickupDateTime?: string | null;
    status?: string | null;
  };
  pickupCoords: {
    lat: number;
    lng: number;
    resolvedLocationName: string;
  };
  summary: {
    totalMatched: number;
    localCount: number;
    regionalCount: number;
    corridorCount: number;
    extendedCount: number;
  };
  drivers: MatchedDriverLead[];
}

export const manualBookingsApi = {
  list: async (params: ManualBookingsParams = {}): Promise<ManualBookingsListResponse> => {
    const res = await apiClient.get<ApiResponse<ManualBookingsListResponse>>("/admin/manual-bookings", {
      params,
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<ManualBookingRecord> => {
    const res = await apiClient.get<ApiResponse<ManualBookingRecord>>(`/admin/manual-bookings/${id}`);
    return res.data.data;
  },

  getMatchedDrivers: async (
    id: string,
    params: { radiusKm?: number; vehicleType?: string; search?: string } = {}
  ): Promise<MatchedDriversResponse> => {
    const res = await apiClient.get<ApiResponse<MatchedDriversResponse>>(
      `/admin/manual-bookings/${id}/matched-drivers`,
      { params }
    );
    return res.data.data;
  },

  create: async (data: Partial<ManualBookingRecord>): Promise<ManualBookingRecord> => {
    const res = await apiClient.post<ApiResponse<ManualBookingRecord>>("/admin/manual-bookings", data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<ManualBookingRecord>): Promise<ManualBookingRecord> => {
    const res = await apiClient.patch<ApiResponse<ManualBookingRecord>>(`/admin/manual-bookings/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(`/admin/manual-bookings/${id}`);
    return res.data.data;
  },

  exportCsvUrl: (params: ManualBookingsParams = {}): string => {
    const token = typeof window !== "undefined" ? localStorage.getItem("parther_admin_access_token") : "";
    const searchParams = new URLSearchParams();
    if (token) searchParams.append("token", token);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "" && val !== "ALL") {
        searchParams.append(key, String(val));
      }
    });
    return `${API_BASE_URL}/admin/manual-bookings/export?${searchParams.toString()}`;
  },
};
