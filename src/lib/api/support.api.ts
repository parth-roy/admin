import apiClient from './client';
import type { ApiResponse, Paginated, SupportTicket, SupportMessage, SupportTicketStatus, TicketsParams } from './types';

export const supportApi = {
  listTickets: async (params: TicketsParams = {}): Promise<Paginated<SupportTicket>> => {
    const res = await apiClient.get<ApiResponse<Paginated<SupportTicket>>>('/admin/support/tickets', { params });
    return res.data.data;
  },

  getTicketById: async (id: string): Promise<SupportTicket> => {
    const res = await apiClient.get<ApiResponse<SupportTicket>>(`/admin/support/tickets/${id}`);
    return res.data.data;
  },

  reply: async (ticketId: string, content: string): Promise<SupportMessage> => {
    const res = await apiClient.post<ApiResponse<SupportMessage>>(`/admin/support/tickets/${ticketId}/reply`, { content });
    return res.data.data;
  },

  setStatus: async (ticketId: string, status: SupportTicketStatus): Promise<SupportTicket> => {
    const res = await apiClient.patch<ApiResponse<SupportTicket>>(`/admin/support/tickets/${ticketId}/status`, { status });
    return res.data.data;
  },
};
