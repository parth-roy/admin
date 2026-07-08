import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/lib/api/support.api';
import type { TicketsParams, SupportTicketStatus } from '@/lib/api/types';

export const SUPPORT_KEYS = {
  tickets: (params: TicketsParams) => ['support', 'tickets', params] as const,
  ticket: (id: string) => ['support', 'ticket', id] as const,
};

export function useTickets(params: TicketsParams = {}) {
  return useQuery({
    queryKey: SUPPORT_KEYS.tickets(params),
    queryFn: () => supportApi.listTickets(params),
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: SUPPORT_KEYS.ticket(id),
    queryFn: () => supportApi.getTicketById(id),
    enabled: !!id,
    staleTime: 15_000,
    refetchInterval: 30_000, // poll for new messages
  });
}

export function useReplyTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string; content: string }) =>
      supportApi.reply(ticketId, content),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.ticket(vars.ticketId) });
      qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
    },
  });
}

export function useSetTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: SupportTicketStatus }) =>
      supportApi.setStatus(ticketId, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.ticket(vars.ticketId) });
      qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
    },
  });
}
