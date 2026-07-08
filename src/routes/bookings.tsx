import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Download, Filter, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBookings } from "@/hooks/useBookings";
import { bookingsApi } from "@/lib/api/bookings.api";
import type { BookingStatus, VehicleType, PaymentStatus, BookingListItem } from "@/lib/api/types";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Parther Admin" }] }),
  component: BookingsPage,
});

function BookingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [vehicleType, setVehicleType] = useState<string>("all-vt");
  const [paymentStatus, setPaymentStatus] = useState<string>("all-pay");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useBookings({
    page,
    limit: 25,
    search: debouncedSearch || undefined,
    status: status !== "all" ? (status as BookingStatus) : undefined,
    vehicleType: vehicleType !== "all-vt" ? (vehicleType as VehicleType) : undefined,
    paymentStatus: paymentStatus !== "all-pay" ? (paymentStatus as PaymentStatus) : undefined,
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
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />Export CSV
          </Button>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((b: BookingListItem) => (
                    <TableRow key={b.id} className="hover:bg-muted/40">
                      <TableCell><Checkbox /></TableCell>
                      <TableCell>
                        <Link to="/bookings/$id" params={{ id: b.id }} className="font-mono text-xs text-info hover:underline">
                          {b.bookingNumber}
                        </Link>
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
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(b.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
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
    </div>
  );
}
