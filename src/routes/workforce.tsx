import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2, Edit, CheckCircle, XCircle, Eye, FileImage, ShieldAlert, Ban } from "lucide-react";
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
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useWorkforce, useUpdateWorkerBank, useCreditWorkerWallet, useWorker, useSuspendWorker, useRevokeWorkerVerification } from "@/hooks/useWorkforce";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/workforce")({
  component: WorkforceList,
});

function WorkforceList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState<string>("all");
  
  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [creditingWorker, setCreditingWorker] = useState<any>(null);
  const [viewingWorkerId, setViewingWorkerId] = useState<string | null>(null);

  const { data, isLoading } = useWorkforce({
    page,
    limit: 10,
    search: debouncedSearch,
    status: status !== "all" ? status : undefined,
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Workforce"
        description="Manage laborers and their bank details"
      />

      <Card className="p-4 border-sidebar-border bg-sidebar/50">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              className="pl-8 bg-background"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="ON_JOB">On Job</SelectItem>
              <SelectItem value="OFFLINE">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border border-sidebar-border bg-background overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Work Status</TableHead>
                <TableHead>Doc Status</TableHead>
                <TableHead>Bank Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No workforce members found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((worker: any) => (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{worker.user?.name ?? 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">{worker.user?.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={worker.status} />
                    </TableCell>
                    <TableCell>
                      {worker.isDocVerified ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      ) : worker.documents?.length > 0 ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Pending
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                          <XCircle className="w-3 h-3 mr-1" /> Unverified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {worker.bankVerified ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                          <XCircle className="w-3 h-3 mr-1" /> Unverified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => setViewingWorkerId(worker.id)}
                        >
                          <Eye className="h-4 w-4" /> Profile
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => setEditingWorker(worker)}
                        >
                          <Edit className="h-4 w-4" /> Bank Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => setCreditingWorker(worker)}
                        >
                          <Wallet className="h-4 w-4" /> Credit Wallet
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {data?.totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page === data.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>

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
    </div>
  );
}

function CreditWalletDialog({ worker, open, onOpenChange }: { worker: any, open: boolean, onOpenChange: (open: boolean) => void }) {
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
          toast.success(`Successfully credited ?${numAmount} to ${worker?.user?.name}'s wallet`);
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || err.message);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Credit Wallet - {worker?.user?.name}</DialogTitle>
          <DialogDescription>
            Manually add funds to this worker's wallet.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Amount (?)</label>
            <Input 
              type="number"
              placeholder="e.g. 500" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Note (Optional)</label>
            <Input 
              placeholder="e.g. Manual payment received"
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={creditWallet.isPending}>
            {creditWallet.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Credit Wallet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BankDetailsDialog({ worker, open, onOpenChange }: { worker: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [bankAccountNo, setBankAccountNo] = useState(worker?.bankAccountNo || "");
  const [bankIfsc, setBankIfsc] = useState(worker?.bankIfsc || "");
  const [bankName, setBankName] = useState(worker?.bankName || "");
  const [bankAccountHolderName, setBankAccountHolderName] = useState(worker?.bankAccountHolderName || "");
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
        }
      },
      {
        onSuccess: () => {
          toast("Bank details updated");
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast(err.response?.data?.message || err.message);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bank Details - {worker?.user?.name}</DialogTitle>
          <DialogDescription>
            Update or verify the bank details for this worker.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Account Number</label>
            <Input value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">IFSC Code</label>
            <Input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Bank Name</label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Account Holder Name</label>
            <Input value={bankAccountHolderName} onChange={(e) => setBankAccountHolderName(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="verified"
              checked={bankVerified}
              onChange={(e) => setBankVerified(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="verified" className="text-sm font-medium cursor-pointer">
              Mark as Verified
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateBank.isPending}>
            {updateBank.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function WorkerProfileDialog({ workerId, open, onOpenChange }: { workerId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
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
    if (!confirm("Are you sure you want to revoke their verification? They will need to be re-verified.")) return;
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
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                {worker.user?.profileImageUrl ? (
                  <img src={worker.user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-slate-400">{worker.user?.name?.charAt(0) || '?'}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {worker.user?.name || "Unknown"}
                  {!worker.isActive && <Badge variant="destructive">Suspended</Badge>}
                </h3>
                <p className="text-muted-foreground">{worker.user?.phone} &middot; {worker.user?.email || 'No email'}</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Button variant={worker.isActive ? "destructive" : "default"} size="sm" onClick={handleSuspend} disabled={suspendMut.isPending}>
                  {suspendMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                  {worker.isActive ? "Suspend Worker" : "Activate Worker"}
                </Button>
                {worker.isDocVerified && (
                  <Button variant="outline" size="sm" onClick={handleRevoke} disabled={revokeMut.isPending}>
                    {revokeMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
                    Revoke Verification
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-3 bg-slate-50"><div className="text-xs text-muted-foreground">Rating</div><div className="font-bold">{worker.rating} ⭐</div></Card>
              <Card className="p-3 bg-slate-50"><div className="text-xs text-muted-foreground">Total Jobs</div><div className="font-bold">{worker.totalJobs}</div></Card>
              <Card className="p-3 bg-slate-50"><div className="text-xs text-muted-foreground">Acceptance</div><div className="font-bold">{worker.acceptanceRate}%</div></Card>
              <Card className="p-3 bg-slate-50"><div className="text-xs text-muted-foreground">Verification</div><div className="font-bold">{worker.isDocVerified ? <span className="text-green-600">Verified</span> : <span className="text-yellow-600">Pending</span>}</div></Card>
            </div>

            <div>
              <h4 className="font-medium mb-3">Documents</h4>
              {(!worker.documents || worker.documents.length === 0) ? (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {worker.documents.map((doc: any) => (
                    <div key={doc.id} className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
                        {doc.type}
                        {doc.status === 'APPROVED' && <CheckCircle className="w-3 h-3 text-green-500" />}
                        {doc.status === 'REJECTED' && <XCircle className="w-3 h-3 text-red-500" />}
                        {doc.status === 'PENDING' && <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />}
                      </span>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="block relative group rounded-md overflow-hidden border">
                        <div className="aspect-square bg-slate-100 flex items-center justify-center">
                          <img src={doc.fileUrl} alt={doc.type} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <FileImage className="text-white h-6 w-6" />
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
