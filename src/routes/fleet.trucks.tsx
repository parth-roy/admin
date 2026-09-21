import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useFleetTrucks, useHardDeleteFleetTruck, useBulkHardDeleteFleetTrucks,
} from "@/hooks/useFleet";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { BulkDeleteConfirmDialog } from "@/components/admin/BulkDeleteConfirmDialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { FleetTruck } from "@/lib/api/types";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

export const Route = createFileRoute("/fleet/trucks")({
  head: () => ({ meta: [{ title: "Fleet Trucks — Parther Admin" }] }),
  component: FleetTrucksPage,
});

function FleetTrucksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FleetTruck | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useFleetTrucks({
    page, limit: 25, search: debouncedSearch || undefined,
  });

  const hardDeleteMut = useHardDeleteFleetTruck();
  const bulkHardDeleteMut = useBulkHardDeleteFleetTrucks();

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-IN") : "—";

  const isExpiringSoon = (iso: string | null) => {
    if (!iso) return false;
    return new Date(iso).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
  };

  const pageIds = data?.data?.map((t: FleetTruck) => t.id) ?? [];
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
    setSearch("");
    setPage(1);
    setSelectedIds(new Set());
    setSelectAllFiltered(false);
  };

  const handleConfirmBulkDelete = async (reason: string) => {
    try {
      const payload: any = { reason };
      if (selectAllFiltered) {
        payload.selectAllFiltered = true;
        payload.filter = {
          search: debouncedSearch || undefined,
        };
      } else {
        payload.ids = Array.from(selectedIds);
      }

      const res = await bulkHardDeleteMut.mutateAsync(payload);
      toast.success(`Successfully permanently deleted ${res.deletedCount} fleet truck(s).`);
      if (res.skippedCount > 0) {
        toast.warning(`Skipped ${res.skippedCount} fleet truck(s) due to active bookings.`);
      }
      setSelectedIds(new Set());
      setSelectAllFiltered(false);
      setIsBulkDeleteOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to bulk delete fleet trucks");
    }
  };

  return (
    <div>
      <PageHeader title="Fleet Trucks" description={total ? `${total} trucks registered` : "Loading…"} />
      <div className="space-y-4 p-6">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input className="pl-9" placeholder="Search by registration number or company…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            {search && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
            {search && total > 0 && (
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
                    ? `All ${total.toLocaleString("en-IN")} filtered trucks selected`
                    : `${selectedIds.size} truck${selectedIds.size > 1 ? "s" : ""} selected on this page`}
                </span>
                {total > (data?.data?.length ?? 0) && !selectAllFiltered && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs font-semibold text-red-700 underline dark:text-red-400"
                    onClick={() => setSelectAllFiltered(true)}
                  >
                    Select all {total.toLocaleString("en-IN")} trucks matching filter
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
                  <TableHead>Reg No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Fleet Owner</TableHead>
                  <TableHead>RC Verif</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Fitness</TableHead>
                  <TableHead>PUC</TableHead>
                  <TableHead>Permit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((t: FleetTruck) => (
                    <TableRow key={t.id} className="hover:bg-muted/40">
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selectedIds.has(t.id)}
                          onCheckedChange={() => toggleSelectOne(t.id)}
                          aria-label={`Select ${t.registrationNo ?? t.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">{t.registrationNo}</TableCell>
                      <TableCell className="text-xs">{t.vehicleType?.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-sm">
                        {t.fleetOwner?.companyName ?? t.fleetOwner?.user?.name ?? "—"}
                      </TableCell>
                      <TableCell><StatusBadge status={t.rcVerifStatus} /></TableCell>
                      {[t.insuranceExpiry, t.fitnessExpiry, t.pucExpiry, t.permitExpiry].map((exp, i) => (
                        <TableCell key={i} className={isExpiringSoon(exp) ? "text-destructive font-medium" : "text-muted-foreground"}>
                          <span className="text-xs">{fmtDate(exp)}</span>
                          {isExpiringSoon(exp) && <span className="ml-1 text-[10px] bg-destructive/15 rounded px-1">Expiring!</span>}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(t)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">No trucks found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>{total > 0 ? `${((page-1)*25)+1}–${Math.min(page*25,total)} of ${total}` : "No results"}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}>
                <ChevronLeft className="h-4 w-4" />Prev
              </Button>
              <span className="text-xs">{page}/{totalPages||1}</span>
              <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>
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
          entityLabel="Fleet Truck"
          entityName={deleteTarget.registrationNo ?? deleteTarget.id}
          softDeleteLabel="Deactivate Truck"
          onHardDelete={async (reason) => {
            await hardDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Fleet truck permanently deleted");
            setDeleteTarget(null);
          }}
        />
      )}

      <BulkDeleteConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        entityLabel="Fleet Trucks"
        selectedCount={selectAllFiltered ? total : selectedIds.size}
        onConfirm={handleConfirmBulkDelete}
        isLoading={bulkHardDeleteMut.isPending}
      />
    </div>
  );
}
