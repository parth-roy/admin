import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/lib/api/finance.api";
import type { FinanceParams, SubscriptionPlan } from "@/lib/api/types";

export const FINANCE_KEYS = {
  revenue: (params: FinanceParams) => ["finance", "revenue", params] as const,
  revenueTrend: (days: number) => ["finance", "trend", days] as const,
  driverEarnings: (params: FinanceParams) => ["finance", "driver-earnings", params] as const,
  fleetEarnings: (params: FinanceParams) => ["finance", "fleet-earnings", params] as const,
  subscriptions: (params: FinanceParams) => ["finance", "subscriptions", params] as const,
  walletTxns: (params: FinanceParams) => ["finance", "wallet-txns", params] as const,
  withdrawals: (params: FinanceParams) => ["finance", "withdrawals", params] as const,
};

export function useRevenue(params: FinanceParams = {}) {
  return useQuery({
    queryKey: FINANCE_KEYS.revenue(params),
    queryFn: () => financeApi.getRevenue(params),
    staleTime: 5 * 60_000,
  });
}

export function useRevenueTrend(days = 30) {
  return useQuery({
    queryKey: FINANCE_KEYS.revenueTrend(days),
    queryFn: () => financeApi.getRevenueTrend(days),
    staleTime: 5 * 60_000,
  });
}

export function useDriverEarnings(params: FinanceParams = {}) {
  return useQuery({
    queryKey: FINANCE_KEYS.driverEarnings(params),
    queryFn: () => financeApi.listDriverEarnings(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useMarkEarningPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.markEarningPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "driver-earnings"] }),
  });
}

export function useFleetEarnings(params: FinanceParams = {}) {
  return useQuery({
    queryKey: FINANCE_KEYS.fleetEarnings(params),
    queryFn: () => financeApi.listFleetEarnings(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useSubscriptions(params: FinanceParams = {}) {
  return useQuery({
    queryKey: FINANCE_KEYS.subscriptions(params),
    queryFn: () => financeApi.listSubscriptions(params),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { plan?: SubscriptionPlan; endDate?: string; isActive?: boolean };
    }) => financeApi.updateSubscription(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "subscriptions"] }),
  });
}

export function useWalletTransactions(params: FinanceParams = {}) {
  return useQuery({
    queryKey: FINANCE_KEYS.walletTxns(params),
    queryFn: () => financeApi.listWalletTransactions(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useWithdrawals(params: FinanceParams = {}) {
  return useQuery({
    queryKey: FINANCE_KEYS.withdrawals(params),
    queryFn: () => financeApi.listWithdrawals(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useCollectCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      entityType: "DRIVER" | "FLEET" | "WORKER";
      entityId: string;
      amount: number;
      note?: string;
    }) => financeApi.collectCash(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "wallet-txns"] }),
  });
}

export function useRetryWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.retryWithdrawal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "withdrawals"] }),
  });
}
