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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSubscriptions, useUpdateSubscription } from "@/hooks/useFinance";
import type { SubscriptionPlan } from "@/lib/api/types";

export const Route = createFileRoute("/finance/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — Parther Admin" }] }),
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [planFilter, setPlanFilter] = useState("all");
  const [editSub, setEditSub] = useState<any | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const { data, isLoading, isFetching } = useSubscriptions({
    page, limit: 25,
    plan: planFilter !== "all" ? (planFilter as SubscriptionPlan) : undefined,
    isActive: true,
  });
  const updateMut = useUpdateSubscription();

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN");

  const PLAN_COLORS: Record<string, string> = {
    BASIC: "text-muted-foreground border-muted",
    STANDARD: "text-info border-info/40",
    PRO: "text-primary border-primary/40",
    PREMIUM: "text-warning-foreground border-warning/40",
  };

  const handleUpdate = async () => {
    if (!editSub) return;
    try {
      await updateMut.mutateAsync({
        id: editSub.id,
        data: {
          plan: editPlan as SubscriptionPlan,
          endDate: editEndDate || undefined,
        },
      });
      toast.success("Subscription updated");
      setEditSub(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Update failed");
    }
  };

  return (
    <div>
      <PageHeader title="Driver Subscriptions" description="Manage subscription plans and expiry." />
      <div className="space-y-4 p-6">
        <div className="flex gap-3">
          <Select value={planFilter} onValueChange={v => { setPlanFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              <SelectItem value="BASIC">Basic</SelectItem>
              <SelectItem value="STANDARD">Standard</SelectItem>
              <SelectItem value="PRO">Pro</SelectItem>
              <SelectItem value="PREMIUM">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <div className="relative">
            {isFetching && !isLoading && <div className="absolute right-4 top-3 z-10"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((s: any) => (
                    <TableRow key={s.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="text-sm font-medium">{s.driver?.user?.name ?? s.driverId?.slice(0, 8) ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.driver?.user?.phone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={PLAN_COLORS[s.plan] ?? ""}>{s.plan}</Badge>
                      </TableCell>
                      <TableCell className={`text-sm ${new Date(s.endDate) < new Date() ? "text-destructive" : "text-muted-foreground"}`}>
                        {fmtDate(s.endDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={s.isActive ? "text-success border-success/40" : "text-destructive border-destructive/40"}>
                          {s.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => { setEditSub(s); setEditPlan(s.plan); setEditEndDate(s.endDate.slice(0, 10)); }}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No subscriptions found</TableCell></TableRow>
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

      {/* Edit subscription dialog */}
      <Dialog open={!!editSub} onOpenChange={() => setEditSub(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Subscription</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>End Date</Label>
              <Input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSub(null)}>Cancel</Button>
            <Button disabled={updateMut.isPending} onClick={handleUpdate}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
