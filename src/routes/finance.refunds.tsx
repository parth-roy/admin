import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useWalletTransactions } from "@/hooks/useFinance";

export const Route = createFileRoute("/finance/refunds")({
  head: () => ({ meta: [{ title: "Refunds — Parther Admin" }] }),
  component: RefundsPage,
});

function RefundsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useWalletTransactions({ page, limit: 25, reason: "REFUND" });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });

  return (
    <div>
      <PageHeader title="Refunds" description="All booking refunds issued to customer wallets." />
      <div className="space-y-4 p-6">
        <Card>
          <div className="relative">
            {isFetching && !isLoading && <div className="absolute right-4 top-3 z-10"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Refund Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((t: any) => (
                    <TableRow key={t.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="text-sm font-medium">{t.wallet?.user?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{t.wallet?.user?.phone}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-success font-medium">
                        +₹{Number(t.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        ₹{Number(t.balanceAfter).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{t.note ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(t.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No refunds found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>{total > 0 ? `${total} refunds total` : "No refunds"}</span>
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
