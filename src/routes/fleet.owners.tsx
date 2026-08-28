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
  useSoftDeleteFleetOwner, useHardDeleteFleetOwner,
} from "@/hooks/useFleet";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
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

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN");

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

  const resetFilters = () => { setSearch(""); setVerifiedFilter("all"); setActiveFilter("all"); setPage(1); };
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
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((o: FleetOwnerListItem) => (
                    <TableRow key={o.id} className="hover:bg-muted/40">
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
                    <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">No fleet owners found</TableCell>
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
    </div>
  );
}
