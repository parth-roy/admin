import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Shield } from "lucide-react";
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
import { useUlipLogs } from "@/hooks/usePlatform";

export const Route = createFileRoute("/compliance/ulip")({
  head: () => ({ meta: [{ title: "ULIP Logs — Parther Admin" }] }),
  component: UlipLogsPage,
});

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "text-success border-success/40",
  FAILED: "text-destructive border-destructive/40",
  MANUAL_REVIEW: "text-warning-foreground border-warning/40",
  PENDING: "text-muted-foreground border-muted",
};

function UlipLogsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, isFetching } = useUlipLogs({
    page, limit: 25,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });

  return (
    <div>
      <PageHeader
        title="ULIP Verification Logs"
        description="Driver licence verification requests via ULIP / Parivahan API."
        actions={isFetching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      />
      <div className="space-y-4 p-6">
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="SUCCESS">Verified</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="MANUAL_REVIEW">Manual Review</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>DL Number</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Code</TableHead>
                <TableHead>Verified At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                ))
              ) : logs.length ? (
                logs.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="text-sm font-medium">{log.driver?.user?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{log.driver?.user?.phone}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.licenseNumber ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.dob ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[log.status] ?? ""}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{log.responseCode ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.verifiedAt ? fmtDate(log.verifiedAt) : "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No ULIP logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>{total > 0 ? `${total} logs total` : "No logs"}</span>
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
