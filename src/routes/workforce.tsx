import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2, Edit, CheckCircle, XCircle } from "lucide-react";
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
import { useWorkforce, useUpdateWorkerBank } from "@/hooks/useWorkforce";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce")({
  component: WorkforceList,
});

function WorkforceList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState<string>("all");
  
  const [editingWorker, setEditingWorker] = useState<any>(null);

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
                <TableHead>Status</TableHead>
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
                    <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => setEditingWorker(worker)}
                      >
                        <Edit className="h-4 w-4" /> Bank Details
                      </Button>
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
    </div>
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
