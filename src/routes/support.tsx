import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useTickets, useTicket, useReplyTicket, useSetTicketStatus } from "@/hooks/useSupport";
import type { SupportTicketStatus } from "@/lib/api/types";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — Parther Admin" }] }),
  component: Support,
});

function Support() {
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: ticketList, isLoading: listLoading } = useTickets({
    status: statusFilter !== "all" ? (statusFilter as SupportTicketStatus) : undefined,
    limit: 30, page: 1,
  });

  const { data: activeTicket, isLoading: ticketLoading } = useTicket(selectedId ?? "");
  const replyMut = useReplyTicket();
  const statusMut = useSetTicketStatus();

  const tickets = ticketList?.data ?? [];
  const openCount = tickets.filter((t: any) => t.status === "OPEN").length;
  const inProgCount = tickets.filter((t: any) => t.status === "IN_PROGRESS").length;

  const fmtAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  const handleReply = async () => {
    if (!selectedId || !replyText.trim()) return;
    try {
      await replyMut.mutateAsync({ ticketId: selectedId, content: replyText.trim() });
      toast.success("Reply sent");
      setReplyText("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to send reply");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedId) return;
    try {
      await statusMut.mutateAsync({ ticketId: selectedId, status: newStatus as SupportTicketStatus });
      toast.success(`Ticket marked ${newStatus.toLowerCase().replace("_", " ")}`);
    } catch (e: any) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div>
      <PageHeader title="Support Tickets" description="Customer & driver support workspace." />
      <div className="p-6 space-y-4">
        {/* KPIs */}
        <div className="kpi-grid">
          {[
            { l: "Open", v: listLoading ? "…" : openCount, c: "text-warning-foreground" },
            { l: "In progress", v: listLoading ? "…" : inProgCount, c: "text-info" },
            { l: "Total loaded", v: listLoading ? "…" : (ticketList?.total ?? 0), c: "" },
          ].map(s => (
            <Card key={s.l}><CardContent className="p-5">
              <p className="text-xs uppercase text-muted-foreground">{s.l}</p>
              {listLoading ? <Skeleton className="mt-1 h-9 w-12" /> : (
                <p className={`mt-1 font-display text-3xl font-semibold ${s.c}`}>{s.v}</p>
              )}
            </CardContent></Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tickets</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main layout: list + detail */}
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          {/* Ticket list */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opened</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : tickets.length ? (
                  tickets.map((t: any) => (
                    <TableRow
                      key={t.id}
                      className={`cursor-pointer hover:bg-muted/40 ${selectedId === t.id ? "bg-muted/60" : ""}`}
                      onClick={() => setSelectedId(t.id)}
                    >
                      <TableCell className="text-sm max-w-[260px] truncate font-medium">{t.subject}</TableCell>
                      <TableCell>
                        <div className="text-sm">{t.user?.name ?? t.user?.phone ?? "—"}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.user?.role}</div>
                      </TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtAgo(t.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      No tickets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Ticket detail / reply panel */}
          <Card className="flex flex-col">
            {!selectedId ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                <MessageSquare className="h-8 w-8 opacity-40" />
                <p className="text-sm">Select a ticket to view</p>
              </div>
            ) : ticketLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : activeTicket ? (
              <>
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-base">{activeTicket.subject}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {activeTicket.user?.name ?? activeTicket.user?.phone} · {activeTicket.user?.role}
                    {activeTicket.bookingId && ` · linked to booking ${activeTicket.bookingId}`}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <StatusBadge status={activeTicket.status} />
                    <Select value={activeTicket.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 pt-3">
                  {/* Messages */}
                  <div className="flex-1 space-y-3 max-h-72 overflow-y-auto">
                    {activeTicket.messages?.length ? (
                      activeTicket.messages.map((msg: any) => (
                        <div key={msg.id} className={`rounded-lg p-3 text-sm ${msg.isAgent ? "bg-primary/10 ml-6" : "bg-muted/40"}`}>
                          <p className="text-xs text-muted-foreground mb-1">
                            {msg.isAgent ? "Agent" : (activeTicket.user?.name ?? "User")} · {fmtAgo(msg.createdAt)}
                          </p>
                          {msg.content}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
                    )}
                  </div>
                  {/* Reply box */}
                  <Textarea
                    placeholder="Reply as agent…"
                    rows={3}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" disabled={!replyText.trim() || replyMut.isPending} onClick={handleReply}>
                      {replyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Send reply
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
