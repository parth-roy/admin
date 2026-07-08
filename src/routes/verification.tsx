import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck, ShieldX, Clock, Search, ChevronLeft, ChevronRight,
  Loader2, CheckCircle2, XCircle, FileText,
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useDrivers, useUpdateDocStatus, useSetDocVerified } from "@/hooks/useDrivers";
import type { DriverListItem, DriverDocument } from "@/lib/api/types";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/verification")({
  head: () => ({ meta: [{ title: "Driver Verification — Parther Admin" }] }),
  component: VerificationPage,
});

type ActionMode = { driverId: string; docId: string; action: "VERIFIED" | "REJECTED" } | null;

function VerificationPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [rejectReason, setRejectReason] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Fetch drivers with pending doc verification
  const { data, isLoading, isFetching } = useDrivers({
    page, limit: 20,
    search: debouncedSearch || undefined,
    isDocVerified: false,
  });

  const docStatusMut = useUpdateDocStatus();
  const docVerifiedMut = useSetDocVerified();

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const handleDocAction = async () => {
    if (!actionMode) return;
    try {
      await docStatusMut.mutateAsync({
        driverId: actionMode.driverId,
        docId: actionMode.docId,
        status: actionMode.action,
        rejectedReason: actionMode.action === "REJECTED" ? rejectReason : undefined,
      });
      toast.success(`Document ${actionMode.action === "VERIFIED" ? "approved" : "rejected"}`);
      setActionMode(null);
      setRejectReason("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Action failed");
    }
  };

  const handleMarkAllVerified = async (driverId: string) => {
    try {
      await docVerifiedMut.mutateAsync({ driverId, isDocVerified: true });
      toast.success("Driver marked as fully verified");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="Driver Verification"
        description="Review and approve driver documents and ULIP verification status."
        actions={
          isFetching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null
        }
      />

      <div className="space-y-4 p-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-warning/15">
                <Clock className="h-5 w-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending Docs</p>
                {isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : (
                  <p className="text-2xl font-bold tabular-nums">{total}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-success/15">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">ULIP Verified</p>
                <p className="text-2xl font-bold tabular-nums">—</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-destructive/15">
                <ShieldX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Manual Review</p>
                <p className="text-2xl font-bold tabular-nums">—</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input className="pl-9" placeholder="Search driver name or phone…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </Card>

        {/* Drivers table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Licence No.</TableHead>
                <TableHead>DL Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.data?.length ? (
                data.data.map((d: DriverListItem) => (
                  <TableRow key={d.id} className="align-top">
                    <TableCell>
                      <p className="font-medium text-sm">{d.user?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{d.user?.phone}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{d.licenseNumber}</TableCell>
                    <TableCell><StatusBadge status={d.dlVerifStatus} /></TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        {d.documents?.length > 0 ? d.documents.map((doc: Pick<DriverDocument, 'id' | 'type' | 'status'>) => (
                          <div key={doc.id} className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs capitalize">{doc.type.replace(/_/g, " ").toLowerCase()}</span>
                            <StatusBadge status={doc.status} />
                            {doc.status === "PENDING" && (
                              <div className="flex gap-1 ml-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-success hover:text-success"
                                  onClick={() => setActionMode({ driverId: d.id, docId: doc.id, action: "VERIFIED" })}>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => setActionMode({ driverId: d.id, docId: doc.id, action: "REJECTED" })}>
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )) : (
                          <span className="text-xs text-muted-foreground">No documents uploaded</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {!d.isDocVerified && d.documents?.every((doc: Pick<DriverDocument, 'id' | 'type' | 'status'>) => doc.status === "VERIFIED") && (
                        <Button size="sm" className="text-xs" disabled={docVerifiedMut.isPending}
                          onClick={() => handleMarkAllVerified(d.id)}>
                          {docVerifiedMut.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                          Mark Verified
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    ✅ No drivers pending verification
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>{total > 0 ? `${total} pending` : "All clear"}</span>
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

      {/* Approve / Reject dialog */}
      <Dialog open={!!actionMode} onOpenChange={() => { setActionMode(null); setRejectReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionMode?.action === "VERIFIED" ? "Approve document?" : "Reject document?"}
            </DialogTitle>
          </DialogHeader>
          {actionMode?.action === "REJECTED" && (
            <div className="space-y-2">
              <Label>Rejection reason *</Label>
              <Textarea
                placeholder="Describe why the document is rejected…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionMode(null)}>Cancel</Button>
            <Button
              variant={actionMode?.action === "VERIFIED" ? "default" : "destructive"}
              disabled={docStatusMut.isPending || (actionMode?.action === "REJECTED" && !rejectReason)}
              onClick={handleDocAction}
            >
              {docStatusMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {actionMode?.action === "VERIFIED" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
