import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useFleetOwners, useSetFleetOwnerStatus } from "@/hooks/useFleet";
import type { FleetOwnerListItem } from "@/lib/api/types";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/fleet/owners")({
  head: () => ({ meta: [{ title: "Fleet Owners — Parther Admin" }] }),
  component: FleetOwnersPage,
});

function FleetOwnersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);
  const statusMut = useSetFleetOwnerStatus();

  const { data, isLoading, isFetching } = useFleetOwners({
    page, limit: 25, search: debouncedSearch || undefined,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN");

  return (
    <div>
      <PageHeader title="Fleet Owners" description={total ? `${total} fleet owners registered` : "Loading…"} />
      <div className="space-y-4 p-6">
        <Card className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input className="pl-9" placeholder="Search company or owner name…"
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
                  <TableHead>Company</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Trucks</TableHead>
                  <TableHead>Drivers</TableHead>
                  <TableHead className="text-right">Wallet</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((o: FleetOwnerListItem) => (
                    <TableRow key={o.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium text-sm">{o.companyName ?? "—"}</TableCell>
                      <TableCell className="text-sm">{o.user?.name ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{o.user?.phone}</TableCell>
                      <TableCell className="tabular-nums text-sm">{o._count?.trucks ?? 0}</TableCell>
                      <TableCell className="tabular-nums text-sm">{o._count?.drivers ?? 0}</TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        ₹{Number(o.wallet?.cachedBalance ?? 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={o.isVerified ? "text-success border-success/40" : "text-warning border-warning/40"}>
                          {o.isVerified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={o.isActive ? "text-success border-success/40" : "text-destructive border-destructive/40"}>
                          {o.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(o.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!o.isVerified && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-success"
                              disabled={loadingId === `${o.id}-verify`}
                              onClick={async () => {
                                setLoadingId(`${o.id}-verify`);
                                try { await statusMut.mutateAsync({ id: o.id, data: { isVerified: true } }); toast.success("Fleet owner verified"); }
                                catch { toast.error("Action failed"); }
                                finally { setLoadingId(null); }
                              }}>
                              {loadingId === `${o.id}-verify` && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                              Verify
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            disabled={loadingId === `${o.id}-status`}
                            onClick={async () => {
                              setLoadingId(`${o.id}-status`);
                              try { await statusMut.mutateAsync({ id: o.id, data: { isActive: !o.isActive } }); toast.success("Status updated"); }
                              catch { toast.error("Action failed"); }
                              finally { setLoadingId(null); }
                            }}>
                            {loadingId === `${o.id}-status` && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                            {o.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">No fleet owners found</TableCell>
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
