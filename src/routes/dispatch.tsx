import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Radio, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useBookings, useAssignDriver } from "@/hooks/useBookings";
import { useDrivers } from "@/hooks/useDrivers";
import type { BookingListItem, DriverListItem } from "@/lib/api/types";

export const Route = createFileRoute("/dispatch")({
  head: () => ({ meta: [{ title: "Dispatch Queue — Parther Admin" }] }),
  component: Dispatch,
});

function Dispatch() {
  const [assignOpen, setAssignOpen] = useState<string | null>(null); // bookingId
  const [driverSearch, setDriverSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // Unassigned confirmed bookings
  const { data, isLoading, isFetching, refetch } = useBookings({
    status: "CONFIRMED", unassigned: true, limit: 50, page: 1,
  });
  const { data: availableDrivers, isLoading: driversLoading } = useDrivers({
    status: "AVAILABLE", search: driverSearch || undefined, limit: 20, page: 1,
  });
  const assignMut = useAssignDriver();

  const queue = data?.data ?? [];
  const total = data?.total ?? 0;

  const fmtWait = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const handleAssign = async () => {
    if (!assignOpen || !selectedDriver) return;
    try {
      await assignMut.mutateAsync({ bookingId: assignOpen, driverId: selectedDriver });
      toast.success("Driver assigned successfully");
      setAssignOpen(null);
      setSelectedDriver(null);
      setDriverSearch("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Assignment failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="Dispatch Queue"
        description="Confirmed bookings waiting for a driver — assign manually."
        actions={
          <>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />Refresh
            </Button>
          </>
        }
      />

      <div className="p-6 space-y-4">
        {/* KPIs */}
        <div className="kpi-grid">
          {[
            { l: "Unassigned", v: isLoading ? "…" : total, c: "text-warning-foreground" },
            { l: "Available Drivers", v: isLoading ? "…" : (availableDrivers?.total ?? "—"), c: "text-success" },
          ].map((s) => (
            <Card key={s.l}><CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-9 w-16" />
              ) : (
                <p className={`mt-1 font-display text-3xl font-semibold ${s.c}`}>{s.v}</p>
              )}
            </CardContent></Card>
          ))}
        </div>

        <Card>
          <div className="relative">
            {isFetching && !isLoading && (
              <div className="absolute right-4 top-3 z-10">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Fare</TableHead>
                  <TableHead>Waiting</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : queue.length ? (
                  queue.map((b: BookingListItem) => (
                    <TableRow key={b.id} className="hover:bg-muted/40">
                      <TableCell>
                        <Link to="/bookings/$id" params={{ id: b.id }} className="font-mono text-xs text-info hover:underline">
                          {b.bookingNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{b.customer?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{b.customer?.phone}</div>
                      </TableCell>
                      <TableCell className="text-xs">{b.vehicleType?.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        ₹{Number(b.totalFare ?? 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${
                          (Date.now() - new Date(b.createdAt).getTime()) > 900000
                            ? "text-destructive" : "text-warning-foreground"
                        }`}>
                          {fmtWait(b.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => { setAssignOpen(b.id); setSelectedDriver(null); setDriverSearch(""); }}>
                          Assign driver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      ✅ Dispatch queue is empty — all bookings are assigned
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Assign Driver Dialog */}
      <Dialog open={!!assignOpen} onOpenChange={() => { setAssignOpen(null); setSelectedDriver(null); setDriverSearch(""); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign driver to booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Search available drivers</Label>
              <Input
                placeholder="Search by name or phone…"
                value={driverSearch}
                onChange={e => setDriverSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-md border p-2">
              {driversLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : availableDrivers?.data?.length ? (
                availableDrivers.data.map((d: DriverListItem) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDriver(d.id)}
                    className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                      selectedDriver === d.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{d.user?.name ?? "—"}</div>
                    <div className="text-xs opacity-70">{d.user?.phone} · {d.vehicle?.registrationNo ?? "No vehicle"} · ⭐ {Number(d.rating ?? 0).toFixed(1)}</div>
                  </button>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No available drivers</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(null)}>Cancel</Button>
            <Button disabled={!selectedDriver || assignMut.isPending} onClick={handleAssign}>
              {assignMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
