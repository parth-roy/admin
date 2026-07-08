import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users.api';
import type { UsersParams } from '@/lib/api/types';

export const USER_KEYS = {
  all: ['users'] as const,
  list: (params: UsersParams) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};

export function useUsers(params: UsersParams = {}) {
  return useQuery({
    queryKey: USER_KEYS.list(params),
    queryFn: () => usersApi.list(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => usersApi.setStatus(id, isActive),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: USER_KEYS.detail(vars.id) });
      qc.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });
}

export function useForceLogoutUser() {
  return useMutation({
    mutationFn: (id: string) => usersApi.forceLogout(id),
  });
}

export function useAdminWalletCredit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note: string }) =>
      usersApi.walletCredit(id, amount, note),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: USER_KEYS.detail(vars.id) });
    },
  });
}
