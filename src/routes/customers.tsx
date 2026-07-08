import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2, Wallet } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useUsers, useToggleUserStatus, useAdminWalletCredit } from "@/hooks/useUsers";
import type { UserListItem } from "@/lib/api/types";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — Parther Admin" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [creditUser, setCreditUser] = useState<{ id: string; name: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useUsers({
    page, limit: 25, role: "CUSTOMER",
    search: debouncedSearch || undefined,
  });

  const toggleMut = useToggleUserStatus();
  const creditMut = useAdminWalletCredit();

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

  return (
    <div>
      <PageHeader
        title="Customers"
        description={total ? `${total.toLocaleString("en-IN")} registered customers` : "Loading…"}
      />
      <div className="space-y-4 p-6">
        <Card className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input className="pl-9" placeholder="Search by name or phone…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
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
                  <TableHead>Actions</TableHead>
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
                      <TableCell className="text-xs text-muted-foreground">{u.email ?? "—"}</TableCell>
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
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => setCreditUser({ id: u.id, name: u.name ?? u.phone })}>
                            <Wallet className="h-3 w-3 mr-1" />Credit
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            disabled={loadingId === u.id}
                            onClick={async () => {
                              setLoadingId(u.id);
                              try {
                                await toggleMut.mutateAsync({ id: u.id, isActive: !u.isActive });
                                toast.success(`User ${u.isActive ? "blocked" : "unblocked"}`);
                              } catch { toast.error("Action failed"); }
                              finally { setLoadingId(null); }
                            }}>
                            {loadingId === u.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                            {u.isActive ? "Block" : "Unblock"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No customers found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>{total > 0 ? `${((page-1)*25)+1}–${Math.min(page*25,total)} of ${total}` : "No results"}</span>
            <div className="flex gap-2">
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

      {/* Wallet credit dialog */}
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
              <Input placeholder="Reason for credit…" value={creditNote} onChange={e => setCreditNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditUser(null)}>Cancel</Button>
            <Button disabled={!creditAmount || creditMut.isPending} onClick={handleCredit}>
              {creditMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Credit wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
