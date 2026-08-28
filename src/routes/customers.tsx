import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, Loader2, Wallet,
  Ban, CheckCircle, Trash2, LogOut, Filter, X,
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
import {
  useUsers, useToggleUserStatus, useAdminWalletCredit,
  useForceLogoutUser, useSoftDeleteUser, useHardDeleteUser,
} from "@/hooks/useUsers";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import type { UserListItem } from "@/lib/api/types";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — SUPER ADMIN" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [creditUser, setCreditUser] = useState<{ id: string; name: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const isActiveParam =
    statusFilter === "active" ? true : statusFilter === "blocked" ? false : undefined;

  const { data, isLoading, isFetching } = useUsers({
    page,
    limit: 25,
    role: "CUSTOMER",
    search: debouncedSearch || undefined,
    isActive: isActiveParam,
  });

  const toggleMut = useToggleUserStatus();
  const creditMut = useAdminWalletCredit();
  const logoutMut = useForceLogoutUser();
  const softDeleteMut = useSoftDeleteUser();
  const hardDeleteMut = useHardDeleteUser();

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN");

  const handleCredit = async () => {
    if (!creditUser) return;
    const amt = parseFloat(creditAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await creditMut.mutateAsync({ id: creditUser.id, amount: amt, note: creditNote });
      toast.success(`₹${amt} credited to ${creditUser.name}'s wallet`);
      setCreditUser(null); setCreditAmount(""); setCreditNote("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Credit failed");
    }
  };

  const handleForceLogout = async (id: string, name: string) => {
    try {
      const result = await logoutMut.mutateAsync(id);
      toast.success(`Revoked ${result.revokedSessions} session(s) for ${name}`);
    } catch {
      toast.error("Force logout failed");
    }
  };

  const resetFilters = () => { setSearch(""); setStatusFilter("all"); setPage(1); };
  const hasFilters = search || statusFilter !== "all";

  return (
    <div>
      <PageHeader
        title="Customers"
        description={total ? `${total.toLocaleString("en-IN")} registered customers` : "Loading…"}
      />
      <div className="space-y-4 p-6">
        {/* Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Search name, phone or email…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Wallet</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((u: UserListItem) => (
                    <TableRow key={u.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium text-sm">{u.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.phone}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{u.email ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={u.isActive ? "text-success border-success/40" : "text-destructive border-destructive/40"}>
                          {u.isActive ? "Active" : "Blocked"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        ₹{Number(u.wallet?.cachedBalance ?? 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{u._count?.bookings ?? 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(u.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          {/* Wallet Credit */}
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                            onClick={() => setCreditUser({ id: u.id, name: u.name ?? u.phone })}>
                            <Wallet className="h-3 w-3 mr-1" />Credit
                          </Button>
                          {/* Block / Unblock */}
                          <Button size="sm" variant="ghost"
                            className={`h-7 text-xs px-2 ${u.isActive ? "text-amber-600 hover:text-amber-700" : "text-success hover:text-success/80"}`}
                            disabled={loadingId === u.id}
                            onClick={async () => {
                              setLoadingId(u.id);
                              try {
                                await toggleMut.mutateAsync({ id: u.id, isActive: !u.isActive });
                                toast.success(`User ${u.isActive ? "blocked" : "unblocked"}`);
                              } catch { toast.error("Action failed"); }
                              finally { setLoadingId(null); }
                            }}>
                            {loadingId === u.id
                              ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              : u.isActive
                                ? <Ban className="h-3 w-3 mr-1" />
                                : <CheckCircle className="h-3 w-3 mr-1" />
                            }
                            {u.isActive ? "Block" : "Unblock"}
                          </Button>
                          {/* Force Logout */}
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-muted-foreground"
                            onClick={() => handleForceLogout(u.id, u.name ?? u.phone)}>
                            <LogOut className="h-3 w-3 mr-1" />Logout
                          </Button>
                          {/* Delete */}
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(u)}>
                            <Trash2 className="h-3 w-3 mr-1" />Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>{total > 0 ? `${((page-1)*25)+1}–${Math.min(page*25,total)} of ${total}` : "No results"}</span>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}>
                <ChevronLeft className="h-4 w-4" />Previous
              </Button>
              <span className="text-xs">{page}/{totalPages||1}</span>
              <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>
                Next<ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Wallet Credit Dialog */}
      <Dialog open={!!creditUser} onOpenChange={() => { setCreditUser(null); setCreditAmount(""); setCreditNote(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit wallet — {creditUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Amount (₹) *</Label>
              <Input type="number" placeholder="e.g. 100" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} />
            </div>
            <div><Label>Note</Label>
              <Textarea placeholder="Reason for credit…" value={creditNote} onChange={e => setCreditNote(e.target.value)} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditUser(null)}>Cancel</Button>
            <Button disabled={!creditAmount || creditMut.isPending} onClick={handleCredit}>
              {creditMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Credit Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          entityLabel="Customer"
          entityName={deleteTarget.name ?? deleteTarget.phone}
          softDeleteLabel="Deactivate Account"
          onSoftDelete={async (reason) => {
            await softDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Customer account deactivated");
            setDeleteTarget(null);
          }}
          onHardDelete={async (reason) => {
            await hardDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Customer permanently deleted");
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
