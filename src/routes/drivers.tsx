import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDrivers } from "@/hooks/useDrivers";
import { useDebounce } from "@/hooks/useDebounce";
import type { DriverStatus, UlipVerifStatus, DriverListItem } from "@/lib/api/types";

export const Route = createFileRoute("/drivers")({
  head: () => ({ meta: [{ title: "Drivers — Parther Admin" }] }),
  component: DriversPage,
});

function DriversPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dlVerif, setDlVerif] = useState("all");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useDrivers({
    page,
    limit: 25,
    search: debouncedSearch || undefined,
    status: status !== "all" ? (status as DriverStatus) : undefined,
    dlVerifStatus: dlVerif !== "all" ? (dlVerif as UlipVerifStatus) : undefined,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN");

  return (
    <div>
      <PageHeader
        title="Drivers"
        description={total ? `${total.toLocaleString("en-IN")} registered drivers` : "Loading…"}
      />
      <div className="space-y-4 p-6">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input className="pl-9" placeholder="Search by name, phone or licence…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="ON_TRIP">On Trip</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
                <SelectItem value="BREAK">Break</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dlVerif} onValueChange={v => { setDlVerif(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All DL statuses</SelectItem>
                <SelectItem value="VERIFIED">DL Verified</SelectItem>
                <SelectItem value="PENDING">DL Pending</SelectItem>
                <SelectItem value="FAILED">DL Failed</SelectItem>
                <SelectItem value="MANUAL_REVIEW">Manual Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

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
                  <TableHead>Driver</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>DL / ULIP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Joined</TableHead>
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
                  data.data.map((d: DriverListItem) => (
                    <TableRow key={d.id} className="hover:bg-muted/40">
                      <TableCell>
                        <Link to="/verification" className="font-medium text-sm hover:underline text-info">
                          {d.user?.name ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.user?.phone}</TableCell>
                      <TableCell>
                        <div className="text-xs font-mono">{d.licenseNumber}</div>
                        <StatusBadge status={d.dlVerifStatus} />
                      </TableCell>
                      <TableCell><StatusBadge status={d.status} /></TableCell>
                      <TableCell>
                        {d.isDocVerified ? (
                          <Badge variant="outline" className="text-success border-success/40">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="text-warning border-warning/40">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          {Number(d.rating ?? 0).toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{d.totalTrips ?? 0}</TableCell>
                      <TableCell>
                        {d.subscription ? (
                          <Badge variant="outline">{d.subscription.plan}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {d.vehicle?.registrationNo ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(d.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                      No drivers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>{total > 0 ? `${((page - 1) * 25) + 1}–${Math.min(page * 25, total)} of ${total}` : "No results"}</span>
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
