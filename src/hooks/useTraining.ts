import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../lib/api/client";

export const useTraining = () => {
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: ["admin_training_courses"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/training/courses");
      return data.data;
    },
  });

  const statsQuery = useQuery({
    queryKey: ["admin_training_stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/training/stats");
      return data.data;
    },
  });

  const createCourse = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post("/admin/training/courses", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_training_courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin_training_stats"] });
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await apiClient.patch(`/admin/training/courses/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_training_courses"] });
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/admin/training/courses/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_training_courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin_training_stats"] });
    },
  });

  return {
    courses: coursesQuery.data || [],
    isLoadingCourses: coursesQuery.isLoading,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    createCourse,
    updateCourse,
    deleteCourse,
  };
};
