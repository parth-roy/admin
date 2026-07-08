import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "@/lib/api/client";

export function useWorkforce(params: { page: number; limit: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ["workforce", params],
    queryFn: async () => {
      const res = await api.get("/admin/workforce", { params });
      return res.data;
    },
  });
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: ["worker", id],
    queryFn: async () => {
      const res = await api.get(`/admin/workforce/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useUpdateWorkerBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/admin/workforce/${id}/bank`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["worker", id] });
      queryClient.invalidateQueries({ queryKey: ["workforce"] });
    },
  });
}
