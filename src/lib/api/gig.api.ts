import { apiClient } from './client';

export const gigApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/gig/admin');
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/gig/admin/${id}`);
    return data.data;
  },
};
