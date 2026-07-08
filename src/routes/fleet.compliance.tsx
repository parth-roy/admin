import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useExpiringTrucks } from "@/hooks/useFleet";

export const Route = createFileRoute("/fleet/compliance")({
  head: () => ({ meta: [{ title: "Compliance Monitor — Parther Admin" }] }),
  component: FleetCompliancePage,
});

function FleetCompliancePage() {
  const [days, setDays] = useState(30);
  const { data: trucks, isLoading } = useExpiringTrucks(days);

  const list = trucks ?? [];
  const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-IN") : "—";

  const daysLeft = (iso: string | null) => {
    if (!iso) return null;
    return Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
  };

  const expiredCount = list.filter((t: any) =>
    [t.insuranceExpiry, t.fitnessExpiry, t.pucExpiry, t.permitExpiry].some(
      d => d && new Date(d).getTime() < Date.now()
    )
  ).length;

  return (
    <div>
      <PageHeader
        title="Fleet Compliance Monitor"
        description="Track document expiries across all fleet trucks."
        actions={
          <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Next 7 days</SelectItem>
              <SelectItem value="15">Next 15 days</SelectItem>
              <SelectItem value="30">Next 30 days</SelectItem>
              <SelectItem value="60">Next 60 days</SelectItem>
              <SelectItem value="90">Next 90 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <div className="p-6 space-y-4">
        <div className="kpi-grid">
          {[
            { l: "Expiring (window)", v: isLoading ? "…" : list.length, c: "text-warning-foreground" },
            { l: "Already expired", v: isLoading ? "…" : expiredCount, c: "text-destructive" },
            { l: "Window", v: `${days} days`, c: "" },
          ].map(s => (
            <Card key={s.l}><CardContent className="p-5">
              <p className="text-xs uppercase text-muted-foreground">{s.l}</p>
              {isLoading ? <Skeleton className="mt-1 h-9 w-12" /> : (
                <p className={`mt-1 font-display text-3xl font-semibold ${s.c}`}>{s.v}</p>
              )}
            </CardContent></Card>
          ))}
        </div>

        <Card>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : list.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reg No.</TableHead>
                  <TableHead>Fleet Owner</TableHead>
                  <TableHead>Insurance Exp.</TableHead>
                  <TableHead>Fitness Exp.</TableHead>
                  <TableHead>PUC Exp.</TableHead>
                  <TableHead>Permit Exp.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-sm">{t.registrationNo}</TableCell>
                    <TableCell className="text-sm">
                      {t.fleetOwner?.companyName ?? t.fleetOwner?.user?.name ?? "—"}
                    </TableCell>
                    {[t.insuranceExpiry, t.fitnessExpiry, t.pucExpiry, t.permitExpiry].map((exp, i) => {
                      const dl = daysLeft(exp);
                      const cls = dl !== null && dl < 0 ? "text-destructive font-medium"
                        : dl !== null && dl <= 7 ? "text-destructive"
                        : dl !== null && dl <= 30 ? "text-warning-foreground"
                        : "text-muted-foreground";
                      return (
                        <TableCell key={i} className={cls}>
                          <span className="text-xs">{fmtDate(exp)}</span>
                          {dl !== null && dl < 0 && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-[10px]">
                              <AlertTriangle className="h-3 w-3" />Expired
                            </span>
                          )}
                          {dl !== null && dl >= 0 && dl <= days && (
                            <span className="ml-1 text-[10px]">({dl}d left)</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              ✅ No documents expiring in the next {days} days
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
