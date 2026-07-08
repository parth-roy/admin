import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useWithdrawals, useRetryWithdrawal } from "@/hooks/useFinance";

export const Route = createFileRoute("/finance/withdrawals")({
  head: () => ({ meta: [{ title: "Withdrawals — Parther Admin" }] }),
  component: WithdrawalsPage,
});

function WithdrawalsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useWithdrawals({ page, limit: 25 });
  const retryMutation = useRetryWithdrawal();

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });

  const handleRetry = (id: string) => {
    retryMutation.mutate(id, {
      onSuccess: () => toast.success("Retry initiated successfully"),
      onError: (err: any) => toast.error(err.response?.data?.message || "Failed to retry withdrawal")
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "COMPLETED": return <Badge variant="outline" className="text-success border-success/40">Completed</Badge>;
      case "FAILED": return <Badge variant="outline" className="text-destructive border-destructive/40">Failed</Badge>;
      case "PROCESSING": return <Badge variant="outline" className="text-blue-500 border-blue-500/40">Processing</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      <PageHeader title="Withdrawals" description="Manage driver and workforce payout requests." />
      <div className="space-y-4 p-6">
        <Card>
          <div className="relative">
            {isFetching && !isLoading && <div className="absolute right-4 top-3 z-10"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Razorpay ID</TableHead>
                  <TableHead>Failure Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((w: any) => {
                    let name = "—";
                    let phone = "";
                    if (w.driver) { name = w.driver.user.name; phone = w.driver.user.phone; }
                    else if (w.fleet) { name = w.fleet.companyName; phone = w.fleet.ownerName; }
                    else if (w.worker) { name = w.worker.name; phone = w.worker.phone; }

                    return (
                      <TableRow key={w.id} className="hover:bg-muted/40">
                        <TableCell>
                          <div className="text-sm font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground">{phone}</div>
                        </TableCell>
                        <TableCell className="font-mono tabular-nums font-medium">
                          ₹{Number(w.amount).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>{getStatusBadge(w.status)}</TableCell>
                        <TableCell className="text-xs font-mono">{w.razorpayPayoutId ?? "—"}</TableCell>
                        <TableCell className="text-xs text-destructive max-w-[150px] truncate">{w.failureReason ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(w.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          {w.status === "FAILED" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleRetry(w.id)}
                              disabled={retryMutation.isPending}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" /> Retry
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No withdrawals found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>{total > 0 ? `${((page-1)*25)+1}–${Math.min(page*25,total)} of ${total}` : "No results"}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}><ChevronLeft className="h-4 w-4" />Prev</Button>
              <span className="text-xs">{page}/{totalPages||1}</span>
              <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>Next<ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
