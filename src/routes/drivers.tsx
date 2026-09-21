import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, Loader2, Star,
  Ban, CheckCircle, Trash2, ArrowDownUp, X, Filter,
} from "lucide-react";
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
import {
  useDrivers, useBlockDriver, useOverrideDriverStatus,
  useSoftDeleteDriver, useHardDeleteDriver, useBulkHardDeleteDrivers,
} from "@/hooks/useDrivers";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { BulkDeleteConfirmDialog } from "@/components/admin/BulkDeleteConfirmDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useDebounce } from "@/hooks/useDebounce";
import type { DriverStatus, UlipVerifStatus, DriverListItem } from "@/lib/api/types";
import { toast } from "sonner";

export const Route = createFileRoute("/drivers")({
  head: () => ({ meta: [{ title: "Drivers — SUPER ADMIN" }] }),
  component: DriversPage,
});

function DriversPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dlVerif, setDlVerif] = useState("all");
  const [docVerif, setDocVerif] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DriverListItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useDrivers({
    page,
    limit: 25,
    search: debouncedSearch || undefined,
    status: status !== "all" ? (status as DriverStatus) : undefined,
    dlVerifStatus: dlVerif !== "all" ? (dlVerif as UlipVerifStatus) : undefined,
    isDocVerified: docVerif === "verified" ? true : docVerif === "unverified" ? false : undefined,
  });

  const blockMut = useBlockDriver();
  const overrideStatusMut = useOverrideDriverStatus();
  const softDeleteMut = useSoftDeleteDriver();
  const hardDeleteMut = useHardDeleteDriver();
  const bulkHardDeleteMut = useBulkHardDeleteDrivers();

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN");

  const pageIds = data?.data?.map((d: DriverListItem) => d.id) ?? [];
  const isAllPageSelected = pageIds.length > 0 && pageIds.every((id: string) => selectedIds.has(id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const next = new Set(selectedIds);
      pageIds.forEach((id: string) => next.delete(id));
      setSelectedIds(next);
      setSelectAllFiltered(false);
    } else {
      const next = new Set(selectedIds);
      pageIds.forEach((id: string) => next.add(id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
      setSelectAllFiltered(false);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const resetFilters = () => {
    setSearch(""); setStatus("all"); setDlVerif("all"); setDocVerif("all"); setPage(1);
    setSelectedIds(new Set()); setSelectAllFiltered(false);
  };
  const hasFilters = search || status !== "all" || dlVerif !== "all" || docVerif !== "all";

  const handleConfirmBulkDelete = async (reason: string) => {
    try {
      const payload: any = { reason };
      if (selectAllFiltered) {
        payload.selectAllFiltered = true;
        payload.filter = {
          status: status !== "all" ? status : undefined,
          dlVerifStatus: dlVerif !== "all" ? dlVerif : undefined,
          isDocVerified: docVerif === "verified" ? true : docVerif === "unverified" ? false : undefined,
          search: debouncedSearch || undefined,
        };
      } else {
        payload.ids = Array.from(selectedIds);
      }

      const res = await bulkHardDeleteMut.mutateAsync(payload);
      toast.success(`Successfully permanently deleted ${res.deletedCount} driver(s).`);
      if (res.skippedCount > 0) {
        toast.warning(`Skipped ${res.skippedCount} driver(s) due to active bookings.`);
      }
      setSelectedIds(new Set());
      setSelectAllFiltered(false);
      setIsBulkDeleteOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to bulk delete drivers");
    }
  };

  return (
    <div>
      <PageHeader
        title="Drivers"
        description={total ? `${total.toLocaleString("en-IN")} registered drivers` : "Loading…"}
      />
      <div className="space-y-4 p-6">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input className="pl-9" placeholder="Search by name, phone or licence…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="ON_TRIP">On Trip</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
                <SelectItem value="BREAK">Break</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dlVerif} onValueChange={v => { setDlVerif(v); setPage(1); }}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="All DL Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All DL Statuses</SelectItem>
                <SelectItem value="VERIFIED">DL Verified</SelectItem>
                <SelectItem value="PENDING">DL Pending</SelectItem>
                <SelectItem value="FAILED">DL Failed</SelectItem>
                <SelectItem value="MANUAL_REVIEW">Manual Review</SelectItem>
              </SelectContent>
            </Select>
            <Select value={docVerif} onValueChange={v => { setDocVerif(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Docs" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Docs</SelectItem>
                <SelectItem value="verified">Docs Verified</SelectItem>
                <SelectItem value="unverified">Docs Pending</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
            {hasFilters && total > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectAllFiltered(true);
                  setIsBulkDeleteOpen(true);
                }}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete All Filtered ({total.toLocaleString("en-IN")})
              </Button>
            )}
          </div>
        </Card>

        <Card>
          {/* Bulk Selection Bar */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-red-50/90 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 text-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="font-bold">
                  {selectAllFiltered
                    ? `All ${total.toLocaleString("en-IN")} filtered drivers selected`
                    : `${selectedIds.size} driver${selectedIds.size > 1 ? "s" : ""} selected on this page`}
                </span>
                {total > (data?.data?.length ?? 0) && !selectAllFiltered && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs font-semibold text-red-700 underline dark:text-red-400"
                    onClick={() => setSelectAllFiltered(true)}
                  >
                    Select all {total.toLocaleString("en-IN")} drivers matching filter
                  </Button>
                )}
                {selectAllFiltered && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs font-semibold text-red-700 underline dark:text-red-400"
                    onClick={() => setSelectAllFiltered(false)}
                  >
                    Limit to page selection only ({selectedIds.size})
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => {
                    setSelectedIds(new Set());
                    setSelectAllFiltered(false);
                  }}
                >
                  Deselect All
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs gap-1.5 font-bold"
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Bulk Delete ({selectAllFiltered ? total.toLocaleString("en-IN") : selectedIds.size})
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            {isFetching && !isLoading && (
              <div className="absolute right-4 top-4 z-10">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={isAllPageSelected}
                      onCheckedChange={toggleSelectAllPage}
                      aria-label="Select all on this page"
                    />
                  </TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>DL / ULIP</TableHead>
                  <TableHead>Op. Status</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 12 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((d: DriverListItem) => (
                    <TableRow key={d.id} className="hover:bg-muted/40">
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selectedIds.has(d.id)}
                          onCheckedChange={() => toggleSelectOne(d.id)}
                          aria-label={`Select ${d.user?.name ?? d.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Link to="/verification" className="font-medium text-sm hover:underline text-info">
                          {d.user?.name ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.user?.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={d.user?.isActive ? "text-success border-success/40" : "text-destructive border-destructive/40"}>
                          {d.user?.isActive ? "Active" : "Blocked"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono truncate max-w-[100px]">{d.licenseNumber}</div>
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
                      <TableCell className="text-xs text-muted-foreground">
                        {d.vehicle?.registrationNo ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(d.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          {/* Block/Unblock */}
                          <Button size="sm" variant="ghost"
                            className={`h-7 text-xs px-2 ${d.user?.isActive ? "text-amber-600 hover:text-amber-700" : "text-success hover:text-success/80"}`}
                            disabled={loadingId === `${d.id}-block`}
                            onClick={async () => {
                              setLoadingId(`${d.id}-block`);
                              try {
                                await blockMut.mutateAsync({ id: d.id, isActive: !d.user?.isActive });
                                toast.success(`Driver ${d.user?.isActive ? "blocked" : "unblocked"}`);
                              } catch { toast.error("Action failed"); }
                              finally { setLoadingId(null); }
                            }}>
                            {loadingId === `${d.id}-block`
                              ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              : d.user?.isActive
                                ? <Ban className="h-3 w-3 mr-1" />
                                : <CheckCircle className="h-3 w-3 mr-1" />
                            }
                            {d.user?.isActive ? "Block" : "Unblock"}
                          </Button>
                          {/* Status Override */}
                          <Select
                            value={d.status}
                            onValueChange={async (val) => {
                              if (val === d.status) return;
                              setLoadingId(`${d.id}-status`);
                              try {
                                await overrideStatusMut.mutateAsync({ id: d.id, status: val as any });
                                toast.success(`Status set to ${val}`);
                              } catch { toast.error("Status update failed"); }
                              finally { setLoadingId(null); }
                            }}>
                            <SelectTrigger className="h-7 w-[105px] text-xs">
                              {loadingId === `${d.id}-status`
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <ArrowDownUp className="h-3 w-3 mr-1" />
                              }
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AVAILABLE">Available</SelectItem>
                              <SelectItem value="OFFLINE">Offline</SelectItem>
                              <SelectItem value="BREAK">Break</SelectItem>
                            </SelectContent>
                          </Select>
                          {/* Delete */}
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(d)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="py-12 text-center text-muted-foreground">
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

      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          entityLabel="Driver"
          entityName={deleteTarget.user?.name ?? deleteTarget.user?.phone ?? deleteTarget.id}
          softDeleteLabel="Block & Deactivate Driver"
          onSoftDelete={async (reason) => {
            await softDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Driver account deactivated");
            setDeleteTarget(null);
          }}
          onHardDelete={async (reason) => {
            await hardDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Driver permanently deleted");
            setDeleteTarget(null);
          }}
        />
      )}

      <BulkDeleteConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        entityLabel="Drivers"
        selectedCount={selectAllFiltered ? total : selectedIds.size}
        onConfirm={handleConfirmBulkDelete}
        isLoading={bulkHardDeleteMut.isPending}
      />
    </div>
  );
}
