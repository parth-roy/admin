import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, Loader2,
  Wallet, ShieldCheck, ShieldOff, Trash2, X, CheckCircle, Ban,
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  useFleetOwners, useSetFleetOwnerStatus, useFleetOwnerWalletCredit,
  useSoftDeleteFleetOwner, useHardDeleteFleetOwner, useBulkHardDeleteFleetOwners,
} from "@/hooks/useFleet";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { BulkDeleteConfirmDialog } from "@/components/admin/BulkDeleteConfirmDialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { FleetOwnerListItem } from "@/lib/api/types";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/fleet/owners")({
  head: () => ({ meta: [{ title: "Fleet Owners — SUPER ADMIN" }] }),
  component: FleetOwnersPage,
});

function FleetOwnersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [creditTarget, setCreditTarget] = useState<{ id: string; name: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FleetOwnerListItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useFleetOwners({
    page,
    limit: 25,
    search: debouncedSearch || undefined,
    isVerified: verifiedFilter === "verified" ? true : verifiedFilter === "pending" ? false : undefined,
    isActive: activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined,
  });

  const statusMut = useSetFleetOwnerStatus();
  const creditMut = useFleetOwnerWalletCredit();
  const softDeleteMut = useSoftDeleteFleetOwner();
  const hardDeleteMut = useHardDeleteFleetOwner();
  const bulkHardDeleteMut = useBulkHardDeleteFleetOwners();

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN");

  const pageIds = data?.data?.map((o: FleetOwnerListItem) => o.id) ?? [];
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

  const handleCredit = async () => {
    if (!creditTarget) return;
    const amt = parseFloat(creditAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await creditMut.mutateAsync({ id: creditTarget.id, amount: amt, note: creditNote });
      toast.success(`₹${amt} credited to ${creditTarget.name}`);
      setCreditTarget(null); setCreditAmount(""); setCreditNote("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Credit failed");
    }
  };

  const resetFilters = () => {
    setSearch(""); setVerifiedFilter("all"); setActiveFilter("all"); setPage(1);
    setSelectedIds(new Set()); setSelectAllFiltered(false);
  };

  const handleConfirmBulkDelete = async (reason: string) => {
    try {
      const payload: any = { reason };
      if (selectAllFiltered) {
        payload.selectAllFiltered = true;
        payload.filter = {
          isVerified: verifiedFilter === "verified" ? true : verifiedFilter === "pending" ? false : undefined,
          isActive: activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined,
          search: debouncedSearch || undefined,
        };
      } else {
        payload.ids = Array.from(selectedIds);
      }

      const res = await bulkHardDeleteMut.mutateAsync(payload);
      toast.success(`Successfully permanently deleted ${res.deletedCount} fleet owner(s).`);
      if (res.skippedCount > 0) {
        toast.warning(`Skipped ${res.skippedCount} fleet owner(s) due to active bookings.`);
      }
      setSelectedIds(new Set());
      setSelectAllFiltered(false);
      setIsBulkDeleteOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to bulk delete fleet owners");
    }
  };
  const hasFilters = search || verifiedFilter !== "all" || activeFilter !== "all";

  return (
    <div>
      <PageHeader
        title="Fleet Owners"
        description={total ? `${total.toLocaleString("en-IN")} fleet owners registered` : "Loading…"}
      />
      <div className="space-y-4 p-6">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input className="pl-9" placeholder="Search company, owner name or phone…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={verifiedFilter} onValueChange={v => { setVerifiedFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Verified" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verified Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending Verification</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={v => { setActiveFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Active" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Active Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
                    ? `All ${total.toLocaleString("en-IN")} filtered fleet owners selected`
                    : `${selectedIds.size} fleet owner${selectedIds.size > 1 ? "s" : ""} selected on this page`}
                </span>
                {total > (data?.data?.length ?? 0) && !selectAllFiltered && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs font-semibold text-red-700 underline dark:text-red-400"
                    onClick={() => setSelectAllFiltered(true)}
                  >
                    Select all {total.toLocaleString("en-IN")} fleet owners matching filter
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
                  <TableHead>Company</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-center">Trucks</TableHead>
                  <TableHead className="text-center">Drivers</TableHead>
                  <TableHead className="text-right">Wallet</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((o: FleetOwnerListItem) => (
                    <TableRow key={o.id} className="hover:bg-muted/40">
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selectedIds.has(o.id)}
                          onCheckedChange={() => toggleSelectOne(o.id)}
                          aria-label={`Select ${o.companyName ?? o.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-sm">{o.companyName ?? "—"}</TableCell>
                      <TableCell className="text-sm">{o.user?.name ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{o.user?.phone}</TableCell>
                      <TableCell className="text-center tabular-nums text-sm">{o._count?.trucks ?? 0}</TableCell>
                      <TableCell className="text-center tabular-nums text-sm">{o._count?.drivers ?? 0}</TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        ₹{Number(o.wallet?.cachedBalance ?? 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={o.isVerified ? "text-success border-success/40" : "text-warning border-warning/40"}>
                          {o.isVerified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={o.isActive ? "text-success border-success/40" : "text-destructive border-destructive/40"}>
                          {o.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(o.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          {/* Verify / Unverify */}
                          <Button size="sm" variant="ghost"
                            className={`h-7 text-xs px-2 ${o.isVerified ? "text-warning hover:text-warning/80" : "text-success hover:text-success/80"}`}
                            disabled={loadingId === `${o.id}-verify`}
                            onClick={async () => {
                              setLoadingId(`${o.id}-verify`);
                              try {
                                await statusMut.mutateAsync({ id: o.id, data: { isVerified: !o.isVerified } });
                                toast.success(o.isVerified ? "Verification revoked" : "Fleet owner verified");
                              } catch { toast.error("Action failed"); }
                              finally { setLoadingId(null); }
                            }}>
                            {loadingId === `${o.id}-verify`
                              ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              : o.isVerified ? <ShieldOff className="h-3 w-3 mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />
                            }
                            {o.isVerified ? "Unverify" : "Verify"}
                          </Button>
                          {/* Activate / Deactivate */}
                          <Button size="sm" variant="ghost"
                            className={`h-7 text-xs px-2 ${o.isActive ? "text-amber-600 hover:text-amber-700" : "text-success hover:text-success/80"}`}
                            disabled={loadingId === `${o.id}-status`}
                            onClick={async () => {
                              setLoadingId(`${o.id}-status`);
                              try {
                                await statusMut.mutateAsync({ id: o.id, data: { isActive: !o.isActive } });
                                toast.success(o.isActive ? "Fleet owner deactivated" : "Fleet owner activated");
                              } catch { toast.error("Action failed"); }
                              finally { setLoadingId(null); }
                            }}>
                            {loadingId === `${o.id}-status`
                              ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              : o.isActive ? <Ban className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />
                            }
                            {o.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          {/* Wallet Credit */}
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-info hover:text-info/80"
                            onClick={() => setCreditTarget({ id: o.id, name: o.companyName ?? o.user?.name ?? "Fleet Owner" })}>
                            <Wallet className="h-3 w-3 mr-1" />Credit
                          </Button>
                          {/* Delete */}
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(o)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12 text-center text-muted-foreground">No fleet owners found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>{total > 0 ? `${((page - 1) * 25) + 1}–${Math.min(page * 25, total)} of ${total}` : "No results"}</span>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />Prev
              </Button>
              <span className="text-xs">{page}/{totalPages || 1}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next<ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Wallet Credit Dialog */}
      <Dialog open={!!creditTarget} onOpenChange={() => { setCreditTarget(null); setCreditAmount(""); setCreditNote(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit Fleet Wallet — {creditTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Amount (₹) *</Label>
              <Input type="number" placeholder="e.g. 500" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} />
            </div>
            <div><Label>Note</Label>
              <Textarea placeholder="Reason for credit…" value={creditNote} onChange={e => setCreditNote(e.target.value)} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditTarget(null)}>Cancel</Button>
            <Button disabled={!creditAmount || creditMut.isPending} onClick={handleCredit}>
              {creditMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Credit Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          entityLabel="Fleet Owner"
          entityName={deleteTarget.companyName ?? deleteTarget.user?.name ?? deleteTarget.id}
          softDeleteLabel="Deactivate Fleet Account"
          onSoftDelete={async (reason) => {
            await softDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Fleet owner account deactivated");
            setDeleteTarget(null);
          }}
          onHardDelete={async (reason) => {
            await hardDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Fleet owner permanently deleted");
            setDeleteTarget(null);
          }}
        />
      )}

      <BulkDeleteConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        entityLabel="Fleet Owners"
        selectedCount={selectAllFiltered ? total : selectedIds.size}
        onConfirm={handleConfirmBulkDelete}
        isLoading={bulkHardDeleteMut.isPending}
      />
    </div>
  );
}
