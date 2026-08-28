import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, Loader2, Edit, CheckCircle,
  XCircle, Eye, Trash2, X, Wallet, Ban, ShieldCheck, ShieldOff,
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
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useWorkforce, useUpdateWorkerBank, useCreditWorkerWallet,
  useWorker, useSuspendWorker, useRevokeWorkerVerification,
  useSoftDeleteWorker, useHardDeleteWorker,
} from "@/hooks/useWorkforce";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce")({
  head: () => ({ meta: [{ title: "Workforce — SUPER ADMIN" }] }),
  component: WorkforcePage,
});

function WorkforcePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [workStatus, setWorkStatus] = useState("all");
  const [docStatus, setDocStatus] = useState("all");
  const [bankStatus, setBankStatus] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");

  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [creditingWorker, setCreditingWorker] = useState<any>(null);
  const [viewingWorkerId, setViewingWorkerId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useWorkforce({
    page,
    limit: 25,
    search: debouncedSearch || undefined,
    status: workStatus !== "all" ? workStatus : undefined,
    isDocVerified: docStatus === "verified" ? true : docStatus === "unverified" ? false : undefined,
    bankVerified: bankStatus === "verified" ? true : bankStatus === "unverified" ? false : undefined,
    isActive: activeStatus === "active" ? true : activeStatus === "suspended" ? false : undefined,
  });

  const suspendMut = useSuspendWorker();
  const softDeleteMut = useSoftDeleteWorker();
  const hardDeleteMut = useHardDeleteWorker();

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25) || 1;
  const fmtDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-IN") : "—");

  const resetFilters = () => {
    setSearch("");
    setWorkStatus("all");
    setDocStatus("all");
    setBankStatus("all");
    setActiveStatus("all");
    setPage(1);
  };

  const hasFilters =
    search ||
    workStatus !== "all" ||
    docStatus !== "all" ||
    bankStatus !== "all" ||
    activeStatus !== "all";

  return (
    <div>
      <PageHeader
        title="Workforce"
        description={total ? `${total.toLocaleString("en-IN")} registered workforce members` : "Loading…"}
      />
      <div className="space-y-4 p-6">
        {/* Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Search by worker name, phone or email…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select value={workStatus} onValueChange={(v) => { setWorkStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Work Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Work Statuses</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="ON_JOB">On Job</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={docStatus} onValueChange={(v) => { setDocStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Doc Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doc Statuses</SelectItem>
                <SelectItem value="verified">Docs Verified</SelectItem>
                <SelectItem value="unverified">Docs Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bankStatus} onValueChange={(v) => { setBankStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Bank Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bank Statuses</SelectItem>
                <SelectItem value="verified">Bank Verified</SelectItem>
                <SelectItem value="unverified">Bank Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeStatus} onValueChange={(v) => { setActiveStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Account Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Account Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Data Table */}
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
                  <TableHead>Worker</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Work Status</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead className="text-right">Wallet</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                  data.data.map((worker: any) => (
                    <TableRow key={worker.id} className="hover:bg-muted/40">
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setViewingWorkerId(worker.id)}
                          className="font-medium text-sm text-info hover:underline text-left cursor-pointer"
                        >
                          {worker.user?.name || "—"}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{worker.user?.phone}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            worker.isActive !== false && worker.user?.isActive !== false
                              ? "text-success border-success/40"
                              : "text-destructive border-destructive/40"
                          }
                        >
                          {worker.isActive !== false && worker.user?.isActive !== false ? "Active" : "Suspended"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={worker.status} />
                      </TableCell>
                      <TableCell>
                        {worker.isDocVerified ? (
                          <Badge variant="outline" className="text-success border-success/40">
                            Verified
                          </Badge>
                        ) : worker.documents?.some((d: any) => d.status === "PENDING") ? (
                          <Badge variant="outline" className="text-info border-info/40">
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-warning border-warning/40">
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {worker.bankVerified ? (
                          <Badge variant="outline" className="text-success border-success/40">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-warning border-warning/40">
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        ₹{Number(worker.workerWallet?.cachedBalance ?? 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(worker.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          {/* Profile */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2"
                            onClick={() => setViewingWorkerId(worker.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />Profile
                          </Button>
                          {/* Bank */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2"
                            onClick={() => setEditingWorker(worker)}
                          >
                            <Edit className="h-3 w-3 mr-1" />Bank
                          </Button>
                          {/* Wallet Credit */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2 text-info hover:text-info/80"
                            onClick={() => setCreditingWorker(worker)}
                          >
                            <Wallet className="h-3 w-3 mr-1" />Credit
                          </Button>
                          {/* Suspend / Activate */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 text-xs px-2 ${
                              worker.isActive !== false
                                ? "text-amber-600 hover:text-amber-700"
                                : "text-success hover:text-success/80"
                            }`}
                            disabled={loadingId === `${worker.id}-suspend`}
                            onClick={async () => {
                              setLoadingId(`${worker.id}-suspend`);
                              const nextActive = worker.isActive === false;
                              try {
                                await suspendMut.mutateAsync({ id: worker.id, isActive: nextActive });
                                toast.success(nextActive ? "Worker activated" : "Worker suspended");
                              } catch {
                                toast.error("Action failed");
                              } finally {
                                setLoadingId(null);
                              }
                            }}
                          >
                            {loadingId === `${worker.id}-suspend` ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : worker.isActive !== false ? (
                              <Ban className="h-3 w-3 mr-1" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {worker.isActive !== false ? "Suspend" : "Activate"}
                          </Button>
                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(worker)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                      No workforce members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>
              {total > 0
                ? `${(page - 1) * 25 + 1}–${Math.min(page * 25, total)} of ${total}`
                : "No results"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />Previous
              </Button>
              <span className="text-xs">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next<ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      {editingWorker && (
        <BankDetailsDialog
          worker={editingWorker}
          open={!!editingWorker}
          onOpenChange={(open) => !open && setEditingWorker(null)}
        />
      )}

      {creditingWorker && (
        <CreditWalletDialog
          worker={creditingWorker}
          open={!!creditingWorker}
          onOpenChange={(open) => !open && setCreditingWorker(null)}
        />
      )}

      {viewingWorkerId && (
        <WorkerProfileDialog
          workerId={viewingWorkerId}
          open={!!viewingWorkerId}
          onOpenChange={(open) => !open && setViewingWorkerId(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          entityLabel="Worker"
          entityName={deleteTarget.user?.name ?? deleteTarget.user?.phone ?? "Worker"}
          softDeleteLabel="Deactivate Worker Account"
          onSoftDelete={async (reason) => {
            await softDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Worker account deactivated");
            setDeleteTarget(null);
          }}
          onHardDelete={async (reason) => {
            await hardDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Worker permanently deleted");
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

function CreditWalletDialog({
  worker,
  open,
  onOpenChange,
}: {
  worker: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const creditWallet = useCreditWorkerWallet();

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    creditWallet.mutate(
      {
        workerId: worker.id,
        amount: numAmount,
        note,
      },
      {
        onSuccess: () => {
          toast.success(`₹${numAmount} credited to wallet`);
          onOpenChange(false);
          setAmount("");
          setNote("");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || err.message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Credit Wallet — {worker?.user?.name || worker?.user?.phone}</DialogTitle>
          <DialogDescription>Add funds directly to this worker's wallet.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Reason for crediting..."
              rows={2}
              className="resize-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={creditWallet.isPending || !amount}>
            {creditWallet.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Credit Wallet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BankDetailsDialog({
  worker,
  open,
  onOpenChange,
}: {
  worker: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [bankAccountNo, setBankAccountNo] = useState(worker?.bankAccountNo || "");
  const [bankIfsc, setBankIfsc] = useState(worker?.bankIfsc || "");
  const [bankName, setBankName] = useState(worker?.bankName || "");
  const [bankAccountHolderName, setBankAccountHolderName] = useState(
    worker?.bankAccountHolderName || ""
  );
  const [bankVerified, setBankVerified] = useState<boolean>(worker?.bankVerified || false);

  const updateBank = useUpdateWorkerBank();

  const handleSave = () => {
    updateBank.mutate(
      {
        id: worker.id,
        data: {
          bankAccountNo,
          bankIfsc,
          bankName,
          bankAccountHolderName,
          bankVerified,
        },
      },
      {
        onSuccess: () => {
          toast.success("Bank details updated");
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || err.message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bank Details — {worker?.user?.name}</DialogTitle>
          <DialogDescription>Update or verify the bank details for this worker.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Account Number</Label>
            <Input value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">IFSC Code</Label>
            <Input
              value={bankIfsc}
              onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Bank Name</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Account Holder Name</Label>
            <Input
              value={bankAccountHolderName}
              onChange={(e) => setBankAccountHolderName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="verified"
              checked={bankVerified}
              onChange={(e) => setBankVerified(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="verified" className="text-sm font-medium cursor-pointer">
              Mark Bank Account as Verified
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateBank.isPending}>
            {updateBank.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WorkerProfileDialog({
  workerId,
  open,
  onOpenChange,
}: {
  workerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: worker, isLoading } = useWorker(workerId);
  const suspendMut = useSuspendWorker();
  const revokeMut = useRevokeWorkerVerification();

  const handleSuspend = async () => {
    if (!worker) return;
    const isActive = !worker.isActive;
    try {
      await suspendMut.mutateAsync({ id: worker.id, isActive });
      toast.success(isActive ? "Worker activated" : "Worker suspended");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleRevoke = async () => {
    if (!worker) return;
    try {
      await revokeMut.mutateAsync(worker.id);
      toast.success("Verification revoked. Documents moved to pending.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to revoke verification");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Worker Profile</DialogTitle>
          <DialogDescription>Full details and documents for this workforce member.</DialogDescription>
        </DialogHeader>
        {isLoading || !worker ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                {worker.user?.profileImageUrl ? (
                  <img
                    src={worker.user.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-slate-400">
                    {worker.user?.name?.charAt(0) || "?"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {worker.user?.name || "Unknown"}
                  {!worker.isActive && <Badge variant="destructive">Suspended</Badge>}
                </h3>
                <p className="text-sm text-muted-foreground">{worker.user?.phone}</p>
                <p className="text-xs text-muted-foreground">{worker.user?.email || "No email"}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={worker.isActive ? "destructive" : "default"}
                  size="sm"
                  onClick={handleSuspend}
                  disabled={suspendMut.isPending}
                >
                  {worker.isActive ? (
                    <>
                      <Ban className="w-4 h-4 mr-1" /> Suspend
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" /> Activate
                    </>
                  )}
                </Button>
                {worker.isDocVerified && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-300 hover:bg-amber-50"
                    onClick={handleRevoke}
                    disabled={revokeMut.isPending}
                  >
                    <ShieldOff className="w-4 h-4 mr-1" /> Revoke Verification
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/40 border">
              <div>
                <span className="text-xs text-muted-foreground">Work Status</span>
                <div className="mt-1">
                  <StatusBadge status={worker.status} />
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Document Status</span>
                <div className="mt-1">
                  {worker.isDocVerified ? (
                    <Badge variant="outline" className="text-success border-success/40">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning border-warning/40">
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Bank Account</span>
                <div className="mt-1">
                  {worker.bankVerified ? (
                    <Badge variant="outline" className="text-success border-success/40">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning border-warning/40">
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Completed Jobs</span>
                <div className="font-semibold text-lg">{worker._count?.jobAssignments || 0}</div>
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Uploaded Documents</h4>
              {worker.documents?.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 bg-muted/20 border border-dashed rounded-lg text-center">
                  No documents uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {worker.documents?.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="border rounded-lg p-3 flex items-start gap-3 bg-card"
                    >
                      <div className="p-2 rounded bg-muted">
                        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{doc.type}</span>
                          <Badge
                            variant="outline"
                            className={
                              doc.status === "VERIFIED"
                                ? "text-success border-success/40"
                                : doc.status === "REJECTED"
                                ? "text-destructive border-destructive/40"
                                : "text-info border-info/40"
                            }
                          >
                            {doc.status}
                          </Badge>
                        </div>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-info hover:underline mt-1 inline-block"
                          >
                            View Document &rarr;
                          </a>
                        )}
                        {doc.rejectedReason && (
                          <p className="text-xs text-destructive mt-1">
                            Reason: {doc.rejectedReason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
