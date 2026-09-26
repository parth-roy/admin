import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { Download, Filter, Search, ChevronLeft, ChevronRight, Loader2, CheckCheck, Zap } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AgentDriverModal } from "@/components/admin/AgentDriverModal";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBookings } from "@/hooks/useBookings";
import { useUnreadBookings } from "@/hooks/useUnreadBookings";
import { bookingsApi } from "@/lib/api/bookings.api";
import type { BookingStatus, VehicleType, PaymentStatus, BookingListItem } from "@/lib/api/types";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/bookings/")({
  head: () => ({ meta: [{ title: "Bookings — Parther Admin" }] }),
  component: BookingsPage,
});

function BookingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [vehicleType, setVehicleType] = useState<string>("all-vt");
  const [paymentStatus, setPaymentStatus] = useState<string>("all-pay");
  const [agentSourcedOnly, setAgentSourcedOnly] = useState(false);
  const [selectedAgentDriverBooking, setSelectedAgentDriverBooking] = useState<BookingListItem | null>(null);
  const debouncedSearch = useDebounce(search, 400);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { isBookingUnread, markAsSeen, markAllAsSeen, unreadCount } = useUnreadBookings();

  const { data, isLoading, isFetching, refetch } = useBookings({
    page,
    limit: 25,
    search: debouncedSearch || undefined,
    status: status !== "all" ? (status as BookingStatus) : undefined,
    vehicleType: vehicleType !== "all-vt" ? (vehicleType as VehicleType) : undefined,
    paymentStatus: paymentStatus !== "all-pay" ? (paymentStatus as PaymentStatus) : undefined,
    hasAgentDriver: agentSourcedOnly ? true : undefined,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const from = (page - 1) * 25 + 1;
  const to = Math.min(page * 25, total);

  const handleExport = useCallback(() => {
    const url = bookingsApi.exportCsv();
    window.open(url, "_blank");
  }, []);

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <PageHeader
        title="All Bookings"
        description={total ? `${total.toLocaleString("en-IN")} bookings across all statuses` : "Loading…"}
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={markAllAsSeen}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                Mark all as read ({unreadCount})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />Export CSV
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Search by booking # or customer phone…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="AGENT_SOURCED">⚡ Agent Sourced Only</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="DRIVER_ASSIGNED">Driver Assigned</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vehicleType} onValueChange={v => { setVehicleType(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-vt">All vehicles</SelectItem>
                <SelectItem value="BIKE">Bike</SelectItem>
                <SelectItem value="THREE_WHEELER">3-Wheeler</SelectItem>
                <SelectItem value="TATA_ACE">Tata Ace</SelectItem>
                <SelectItem value="MINI_TRUCK">Mini Truck</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatus} onValueChange={v => { setPaymentStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-pay">All payments</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Quick Agent Sourced Filter Button */}
            <button
              type="button"
              onClick={() => {
                setAgentSourcedOnly(prev => !prev);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                agentSourcedOnly
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/50"
                  : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
              }`}
              title="Filter to show only bookings where an agent has submitted driver and truck details"
            >
              <Zap className={`h-3.5 w-3.5 ${agentSourcedOnly ? "text-amber-500 fill-amber-500 animate-pulse" : "text-amber-500/70"}`} />
              <span>Agent Sourced Only</span>
              {agentSourcedOnly && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-black rounded-full">
                  ON
                </span>
              )}
            </button>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <div className="relative">
            {isFetching && !isLoading && (
              <div className="absolute right-4 top-4 z-10">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"><Checkbox /></TableHead>
                  <TableHead>Booking #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Fare</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right min-w-[180px]">Agent Sourcing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((b: BookingListItem) => {
                    const isUnread = isBookingUnread(b.id);
                    return (
                      <TableRow
                        key={b.id}
                        className={`hover:bg-muted/40 transition-colors ${
                          isUnread ? "bg-red-500/[0.03] dark:bg-red-500/[0.06]" : ""
                        }`}
                      >
                        <TableCell><Checkbox /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link
                              to="/bookings/$id"
                              params={{ id: b.id }}
                              onClick={() => markAsSeen(b.id)}
                              className="font-mono text-xs text-info hover:underline font-semibold"
                            >
                              {b.bookingNumber}
                            </Link>
                            {isUnread && (
                              <span className="inline-flex items-center rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-500 border border-red-500/20 uppercase tracking-wider animate-pulse">
                                NEW
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{b.customer?.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{b.customer?.phone}</div>
                        </TableCell>
                        <TableCell><StatusBadge status={b.status} /></TableCell>
                        <TableCell className="text-xs">{b.vehicleType?.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          ₹{Number(b.totalFare ?? 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell><StatusBadge status={b.paymentStatus} /></TableCell>
                        <TableCell className="text-sm">
                          {b.driver?.user?.name ?? (
                            <span className="text-warning-foreground bg-warning/20 rounded px-2 py-0.5 text-xs">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="text-muted-foreground font-medium">{fmtDate(b.createdAt)}</div>
                          
                          {/* SLA Timer & Persona Display */}
                          {b.slaExpiresAt && (() => {
                            const expiry = new Date(b.slaExpiresAt).getTime();
                            const remaining = expiry - now;
                            const isExpired = remaining <= 0;
                            
                            if (isExpired) {
                              return (
                                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-tight">
                                  <span>⚠️ SLA EXPIRED</span>
                                </div>
                              );
                            }

                            const hours = Math.floor(remaining / 3600000);
                            const mins = Math.floor((remaining % 3600000) / 60000);
                            const secs = Math.floor((remaining % 60000) / 1000);
                            const timeStr = `${hours > 0 ? `${hours}h ` : ""}${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s left`;

                            return (
                              <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black tabular-nums animate-pulse">
                                <span>⏱️ {timeStr}</span>
                              </div>
                            );
                          })()}

                          {/* Persona badge if Enterprise or Contractual */}
                          {b.bookingPersona === "ENTERPRISE" && (
                            <div className="mt-0.5 text-[9px] font-bold text-purple-600 dark:text-purple-400">
                              🏢 Enterprise ({b.truckCount || 1} Trucks)
                            </div>
                          )}
                          {b.bookingPersona === "CONTRACTUAL" && (
                            <div className="mt-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              📋 Contractual
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {b.hasAgentDriver ? (
                            <button
                              onClick={() => setSelectedAgentDriverBooking(b)}
                              className="relative inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.35)] hover:shadow-[0_0_20px_rgba(245,158,11,0.65)] hover:border-amber-400 transition-all duration-200 cursor-pointer animate-pulse"
                              title="Driver & Truck details submitted by verified Agent Partner. Click to view."
                            >
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                              <span className="whitespace-nowrap tracking-tight">Driver Given by Agent</span>
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>
              {total > 0 ? `Showing ${from}–${to} of ${total.toLocaleString("en-IN")}` : "No results"}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />Previous
              </Button>
              <span className="text-xs">{page} / {totalPages || 1}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next<ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Agent Driver Dossier Modal */}
      <AgentDriverModal
        booking={selectedAgentDriverBooking}
        open={!!selectedAgentDriverBooking}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedAgentDriverBooking(null);
        }}
        onAssigned={() => {
          refetch();
        }}
      />
    </div>
  );
}
