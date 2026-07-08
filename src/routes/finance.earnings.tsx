import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useDriverEarnings, useMarkEarningPaid, useFleetEarnings } from "@/hooks/useFinance";

export const Route = createFileRoute("/finance/earnings")({
  head: () => ({ meta: [{ title: "Earnings & Payouts — Parther Admin" }] }),
  component: EarningsPage,
});

function EarningsPage() {
  const [driverPage, setDriverPage] = useState(1);
  const [fleetPage, setFleetPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const markPaidMut = useMarkEarningPaid();

  const { data: driverEarnings, isLoading: dLoading, isFetching: dFetching } = useDriverEarnings({ page: driverPage, limit: 25 });
  const { data: fleetEarnings, isLoading: fLoading, isFetching: fFetching } = useFleetEarnings({ page: fleetPage, limit: 25 });

  const dTotal = driverEarnings?.total ?? 0;
  const fTotal = fleetEarnings?.total ?? 0;

  const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-IN") : "—";

  const handleMarkPaid = async (id: string) => {
    setLoadingId(id);
    try {
      await markPaidMut.mutateAsync(id);
      toast.success("Earnings marked as paid");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Earnings & Payouts" description="Driver and fleet owner earnings management." />
      <div className="p-6">
        <Tabs defaultValue="driver">
          <TabsList>
            <TabsTrigger value="driver">Driver Earnings ({dTotal.toLocaleString("en-IN")})</TabsTrigger>
            <TabsTrigger value="fleet">Fleet Earnings ({fTotal.toLocaleString("en-IN")})</TabsTrigger>
          </TabsList>

          {/* Driver Earnings */}
          <TabsContent value="driver" className="mt-4">
            <Card>
              <div className="relative">
                {dFetching && !dLoading && <div className="absolute right-4 top-3 z-10"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Driver</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead>Paid At</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                      ))
                    ) : driverEarnings?.data?.length ? (
                      driverEarnings.data.map((e: any) => (
                        <TableRow key={e.id} className="hover:bg-muted/40">
                          <TableCell className="text-sm">{e.driver?.user?.name ?? "—"}<div className="text-xs text-muted-foreground">{e.driver?.user?.phone}</div></TableCell>
                          <TableCell className="font-mono text-xs text-info">{e.booking?.bookingNumber}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums">₹{Number(e.amount).toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-right font-mono text-destructive tabular-nums">₹{Number(e.commission).toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-right font-mono text-success tabular-nums font-medium">₹{Number(e.driverNet).toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {e.paidAt ? (
                              <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3.5 w-3.5" />{fmtDate(e.paidAt)}</span>
                            ) : <Badge variant="outline" className="text-warning border-warning/40">Unpaid</Badge>}
                          </TableCell>
                          <TableCell>
                            {!e.paidAt && (
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                disabled={loadingId === e.id}
                                onClick={() => handleMarkPaid(e.id)}>
                                {loadingId === e.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                Mark Paid
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No earnings found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
                <span>{dTotal > 0 ? `${((driverPage-1)*25)+1}–${Math.min(driverPage*25,dTotal)} of ${dTotal}` : "No results"}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={driverPage<=1} onClick={() => setDriverPage(p=>p-1)}><ChevronLeft className="h-4 w-4" />Prev</Button>
                  <Button variant="outline" size="sm" disabled={driverPage>=Math.ceil(dTotal/25)} onClick={() => setDriverPage(p=>p+1)}>Next<ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Fleet Earnings */}
          <TabsContent value="fleet" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fleet Owner</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                    ))
                  ) : fleetEarnings?.data?.length ? (
                    fleetEarnings.data.map((e: any) => (
                      <TableRow key={e.id} className="hover:bg-muted/40">
                        <TableCell className="text-sm">{e.fleetOwner?.companyName ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-info">{e.booking?.bookingNumber}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">₹{Number(e.amount).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right font-mono text-success tabular-nums font-medium">₹{Number(e.fleetNet).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {e.paidAt ? <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3.5 w-3.5" />{fmtDate(e.paidAt)}</span>
                            : <Badge variant="outline" className="text-warning border-warning/40">Unpaid</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(e.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No fleet earnings found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
                <span>{fTotal > 0 ? `${fTotal} total` : "No results"}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={fleetPage<=1} onClick={() => setFleetPage(p=>p-1)}><ChevronLeft className="h-4 w-4" />Prev</Button>
                  <Button variant="outline" size="sm" disabled={fleetPage>=Math.ceil(fTotal/25)} onClick={() => setFleetPage(p=>p+1)}>Next<ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
