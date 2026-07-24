import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "@/lib/api/client";

export function useWorkforce(params: { page: number; limit: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ["workforce", params],
    queryFn: async () => {
      const res = await api.get("/admin/workforce", { params });
      return res.data.data;
    },
  });
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: ["worker", id],
    queryFn: async () => {
      const res = await api.get(`/admin/workforce/${id}`);
      return res.data.data;
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

export function useCreditWorkerWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workerId, amount, note }: { workerId: string; amount: number; note?: string }) => {
      const res = await api.post(`/admin/workforce/${workerId}/wallet-credit`, { amount, note });
      return res.data;
    },
    onSuccess: (_, { workerId }) => {
      queryClient.invalidateQueries({ queryKey: ["worker", workerId] });
      queryClient.invalidateQueries({ queryKey: ["workforce"] });
    },
  });
}

export function useSuspendWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch(`/admin/workforce/${id}/suspend`, { isActive });
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["worker", id] });
      queryClient.invalidateQueries({ queryKey: ["workforce"] });
    },
  });
}

export function useRevokeWorkerVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/admin/workforce/${id}/revoke-verification`);
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["worker", id] });
      queryClient.invalidateQueries({ queryKey: ["workforce"] });
      // Also invalidate pending documents as they are now back in pending list
      queryClient.invalidateQueries({ queryKey: ["pendingWorkerDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["pendingWorkerDocumentsCount"] });
    },
  });
}
