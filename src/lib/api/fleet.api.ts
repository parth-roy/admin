import apiClient from './client';
import type { ApiResponse, Paginated, FleetOwnerListItem, FleetOwnerDetail, FleetTruck, FleetParams } from './types';

export const fleetApi = {
  listOwners: async (params: FleetParams = {}): Promise<Paginated<FleetOwnerListItem>> => {
    const res = await apiClient.get<ApiResponse<Paginated<FleetOwnerListItem>>>('/admin/fleet-owners', { params });
    return res.data.data;
  },

  getOwnerById: async (id: string): Promise<FleetOwnerDetail> => {
    const res = await apiClient.get<ApiResponse<FleetOwnerDetail>>(`/admin/fleet-owners/${id}`);
    return res.data.data;
  },

  setOwnerStatus: async (id: string, data: { isVerified?: boolean; isActive?: boolean }): Promise<FleetOwnerListItem> => {
    const res = await apiClient.patch<ApiResponse<FleetOwnerListItem>>(`/admin/fleet-owners/${id}/status`, data);
    return res.data.data;
  },

  listTrucks: async (params: FleetParams = {}): Promise<Paginated<FleetTruck>> => {
    const res = await apiClient.get<ApiResponse<Paginated<FleetTruck>>>('/admin/fleet-trucks', { params });
    return res.data.data;
  },

  getExpiringTrucks: async (days = 30): Promise<FleetTruck[]> => {
    const res = await apiClient.get<ApiResponse<FleetTruck[]>>('/admin/fleet-trucks/expiring', { params: { days } });
    return res.data.data;
  },
};
