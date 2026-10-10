import apiClient, { API_BASE_URL } from "./client";
import type {
  ApiResponse,
  DriverBidsResponse,
  DriverBidListItem,
  DriverBidsParams,
} from "./types";

export const driverBidsApi = {
  list: async (params: DriverBidsParams = {}): Promise<DriverBidsResponse> => {
    const res = await apiClient.get<ApiResponse<DriverBidsResponse>>("/admin/driver-bids", {
      params,
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>(`/admin/driver-bids/${id}`);
    return res.data.data;
  },

  exportCsv: (): string => {
    const token = localStorage.getItem("parther_admin_access_token");
    return `${API_BASE_URL}/admin/driver-bids/export?token=${token ?? ""}`;
  },
};
