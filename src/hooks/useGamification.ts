import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/client";

export function useGamificationStats() {
  return useQuery({
    queryKey: ["gamification-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/gamification/stats");
      return res.data.data;
    },
  });
}

export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const res = await api.get("/admin/gamification/badges");
      return res.data.data;
    },
  });
}

export function useCreateBadge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/admin/gamification/badges", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}

export function useUpdateBadge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/admin/gamification/badges/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}
