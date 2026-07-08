import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useFleetTrucks } from "@/hooks/useFleet";
import type { FleetTruck } from "@/lib/api/types";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/fleet/trucks")({
  head: () => ({ meta: [{ title: "Fleet Trucks — Parther Admin" }] }),
  component: FleetTrucksPage,
});

function FleetTrucksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useFleetTrucks({
    page, limit: 25, search: debouncedSearch || undefined,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-IN") : "—";

  const isExpiringSoon = (iso: string | null) => {
    if (!iso) return false;
    return new Date(iso).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div>
      <PageHeader title="Fleet Trucks" description={total ? `${total} trucks registered` : "Loading…"} />
      <div className="space-y-4 p-6">
        <Card className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input className="pl-9" placeholder="Search by registration number…"
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
                  <TableHead>Reg No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Fleet Owner</TableHead>
                  <TableHead>RC Verif</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Fitness</TableHead>
                  <TableHead>PUC</TableHead>
                  <TableHead>Permit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((t: FleetTruck) => (
                    <TableRow key={t.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-sm font-medium">{t.registrationNo}</TableCell>
                      <TableCell className="text-xs">{t.vehicleType?.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-sm">
                        {t.fleetOwner?.companyName ?? t.fleetOwner?.user?.name ?? "—"}
                      </TableCell>
                      <TableCell><StatusBadge status={t.rcVerifStatus} /></TableCell>
                      {[t.insuranceExpiry, t.fitnessExpiry, t.pucExpiry, t.permitExpiry].map((exp, i) => (
                        <TableCell key={i} className={isExpiringSoon(exp) ? "text-destructive font-medium" : "text-muted-foreground"}>
                          <span className="text-xs">{fmtDate(exp)}</span>
                          {isExpiringSoon(exp) && <span className="ml-1 text-[10px] bg-destructive/15 rounded px-1">Expiring!</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No trucks found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>{total > 0 ? `${((page-1)*25)+1}–${Math.min(page*25,total)} of ${total}` : "No results"}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}>
                <ChevronLeft className="h-4 w-4" />Prev
              </Button>
              <span className="text-xs">{page}/{totalPages||1}</span>
              <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>
                Next<ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
