import apiClient from "./client";
import type {
  ApiResponse,
  Paginated,
  RevenueOverview,
  RevenueTrendPoint,
  DriverEarning,
  FleetEarning,
  DriverSubscription,
  WalletTransaction,
  FinanceParams,
  SubscriptionPlan,
  Withdrawal,
} from "./types";

type CashCollectionPayload = {
  entityType: "DRIVER" | "FLEET" | "WORKER";
  entityId: string;
  amount: number;
  bookingId?: string;
  note?: string;
};

function normalizePaginated<T>(
  value: Paginated<T> | T[],
  params: FinanceParams = {},
): Paginated<T> {
  if (Array.isArray(value)) {
    const page = params.page ?? 1;
    const limit = params.limit ?? value.length;
    return { total: value.length, page, limit, data: value };
  }
  return value;
}

export const financeApi = {
  getRevenue: async (params: FinanceParams = {}): Promise<RevenueOverview> => {
    const res = await apiClient.get<ApiResponse<RevenueOverview>>("/admin/finance/revenue", {
      params,
    });
    return res.data.data;
  },

  getRevenueTrend: async (days = 30): Promise<RevenueTrendPoint[]> => {
    const res = await apiClient.get<ApiResponse<RevenueTrendPoint[]>>(
      "/admin/dashboard/revenue-trend",
      { params: { days } },
    );
    return res.data.data;
  },

  listDriverEarnings: async (params: FinanceParams = {}): Promise<Paginated<DriverEarning>> => {
    const res = await apiClient.get<ApiResponse<Paginated<DriverEarning>>>(
      "/admin/finance/driver-earnings",
      { params },
    );
    return res.data.data;
  },

  markEarningPaid: async (id: string): Promise<DriverEarning> => {
    const res = await apiClient.patch<ApiResponse<DriverEarning>>(
      `/admin/finance/driver-earnings/${id}/mark-paid`,
    );
    return res.data.data;
  },

  listFleetEarnings: async (params: FinanceParams = {}): Promise<Paginated<FleetEarning>> => {
    const res = await apiClient.get<ApiResponse<Paginated<FleetEarning>>>(
      "/admin/finance/fleet-earnings",
      { params },
    );
    return res.data.data;
  },

  listSubscriptions: async (params: FinanceParams = {}): Promise<Paginated<DriverSubscription>> => {
    const res = await apiClient.get<ApiResponse<Paginated<DriverSubscription>>>(
      "/admin/finance/subscriptions",
      { params },
    );
    return res.data.data;
  },

  updateSubscription: async (
    id: string,
    data: { plan?: SubscriptionPlan; endDate?: string; isActive?: boolean },
  ): Promise<DriverSubscription> => {
    const res = await apiClient.patch<ApiResponse<DriverSubscription>>(
      `/admin/finance/subscriptions/${id}`,
      data,
    );
    return res.data.data;
  },

  listWalletTransactions: async (
    params: FinanceParams = {},
  ): Promise<Paginated<WalletTransaction>> => {
    const res = await apiClient.get<ApiResponse<Paginated<WalletTransaction>>>(
      "/admin/finance/wallet-transactions",
      { params },
    );
    return res.data.data;
  },

  collectCash: async (data: CashCollectionPayload): Promise<WalletTransaction> => {
    const res = await apiClient.post<ApiResponse<WalletTransaction>>(
      "/admin/cash-collection",
      data,
    );
    return res.data.data;
  },

  listWithdrawals: async (params: FinanceParams = {}): Promise<Paginated<Withdrawal>> => {
    const res = await apiClient.get<ApiResponse<Paginated<Withdrawal> | Withdrawal[]>>(
      "/admin/withdrawals",
      { params },
    );
    return normalizePaginated(res.data.data, params);
  },

  retryWithdrawal: async (id: string): Promise<Withdrawal> => {
    const res = await apiClient.patch<ApiResponse<Withdrawal>>(`/admin/withdrawals/${id}/retry`);
    return res.data.data;
  },
};
