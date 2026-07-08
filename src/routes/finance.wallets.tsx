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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useWalletTransactions } from "@/hooks/useFinance";
import type { WalletTransactionReason } from "@/lib/api/types";
import { CashCollectionModal } from "@/components/finance/CashCollectionModal";

export const Route = createFileRoute("/finance/wallets")({
  head: () => ({ meta: [{ title: "Wallets — Parther Admin" }] }),
  component: WalletsPage,
});

function WalletsPage() {
  const [page, setPage] = useState(1);
  const [reason, setReason] = useState("all");

  const { data, isLoading, isFetching } = useWalletTransactions({
    page, limit: 25,
    reason: reason !== "all" ? (reason as WalletTransactionReason) : undefined,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });

  return (
    <div>
      <PageHeader title="Wallet Transactions" description="All wallet credits, debits and refunds." />
      <div className="space-y-4 p-6">
        <div className="flex gap-3">
          <Select value={reason} onValueChange={v => { setReason(v); setPage(1); }}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reasons</SelectItem>
              <SelectItem value="TOP_UP">Top Up</SelectItem>
              <SelectItem value="BOOKING_PAYMENT">Booking Payment</SelectItem>
              <SelectItem value="REFUND">Refund</SelectItem>
              <SelectItem value="CASHBACK">Cashback</SelectItem>
              <SelectItem value="ADMIN_CREDIT">Admin Credit</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <CashCollectionModal>
              <Button>Collect Cash</Button>
            </CashCollectionModal>
          </div>
        </div>

        <Card>
          <div className="relative">
            {isFetching && !isLoading && <div className="absolute right-4 top-3 z-10"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((t: any) => (
                    <TableRow key={t.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="text-sm font-medium">{t.wallet?.user?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{t.wallet?.user?.phone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={t.type === "CREDIT" ? "text-success border-success/40" : "text-destructive border-destructive/40"}>
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.reason?.replace(/_/g, " ")}</TableCell>
                      <TableCell className={`text-right font-mono tabular-nums font-medium ${t.type === "CREDIT" ? "text-success" : "text-destructive"}`}>
                        {t.type === "CREDIT" ? "+" : "−"}₹{Number(t.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        ₹{Number(t.balanceAfter).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{t.note ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(t.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No transactions found</TableCell></TableRow>
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
