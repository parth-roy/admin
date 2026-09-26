import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IndianRupee, CheckCircle2, Clock, XCircle, AlertTriangle,
  ArrowRight, ShieldCheck, Settings, Save, Loader2, RefreshCw,
  Search, ChevronLeft, ChevronRight, FileText, Check, DollarSign, Wallet
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

export function BrokerBountiesView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [settleDialogTarget, setSettleDialogTarget] = useState<any>(null);
  const [settlementRef, setSettlementRef] = useState("");
  const [settlementNotes, setSettlementNotes] = useState("");

  // Commission Rules Form State
  const [customerAdvance, setCustomerAdvance] = useState("25");
  const [platformRetention, setPlatformRetention] = useState("10");
  const [driverAdvance, setDriverAdvance] = useState("15");
  const [defaultBounty, setDefaultBounty] = useState("100");
  const [retentionBonus, setRetentionBonus] = useState("500");
  const [isConfigDirty, setIsConfigDirty] = useState(false);

  // Fetch Commission Config
  const { data: configData, isLoading: isConfigLoading } = useQuery({
    queryKey: ["brokerConfig"],
    queryFn: async () => {
      const res = await apiClient.get("/broker/admin/config");
      return res.data;
    },
  });

  useEffect(() => {
    if (configData?.data) {
      setCustomerAdvance(String(configData.data.customerAdvancePercent ?? 25));
      setPlatformRetention(String(configData.data.platformRetentionPercent ?? 10));
      setDriverAdvance(String(configData.data.driverAdvancePercent ?? 15));
      setDefaultBounty(String(configData.data.defaultFlatFeeBounty ?? 100));
      setRetentionBonus(String(configData.data.driverRetentionBonus ?? 500));
      setIsConfigDirty(false);
    }
  }, [configData]);

  // Update Config Mutation
  const updateConfigMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch("/broker/admin/config", {
        customerAdvancePercent: Number(customerAdvance),
        platformRetentionPercent: Number(platformRetention),
        driverAdvancePercent: Number(driverAdvance),
        defaultFlatFeeBounty: Number(defaultBounty),
        driverRetentionBonus: Number(retentionBonus),
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Platform Commission & Bounty Rules updated successfully");
      setIsConfigDirty(false);
      queryClient.invalidateQueries({ queryKey: ["brokerConfig"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update commission rules");
    },
  });

  // Fetch Bounty Ledger
  const { data: bountyData, isLoading: isBountiesLoading, isFetching: isBountiesFetching, refetch } = useQuery({
    queryKey: ["adminBounties", page, statusFilter],
    queryFn: async () => {
      const res = await apiClient.get("/broker/admin/bounty-dashboard", {
        params: {
          page,
          limit: 20,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      });
      return res.data;
    },
  });

  // Settle Bounty Mutation
  const settleMutation = useMutation({
    mutationFn: async ({ quoteId, ref, notes }: { quoteId: string; ref: string; notes?: string }) => {
      const res = await apiClient.patch(`/broker/bounty/${quoteId}/settle`, {
        settlementRef: ref,
        notes,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Bounty marked as Manually Settled (Bank Transfer Recorded)");
      queryClient.invalidateQueries({ queryKey: ["adminBounties"] });
      setSettleDialogTarget(null);
      setSettlementRef("");
      setSettlementNotes("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to settle bounty");
    },
  });

  const ledgers = bountyData?.data || [];
  const meta = bountyData?.meta || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Agent Bounties & Commission Rules"
        description="Configure the 25% customer advance split, set default flat-fee agent bounties, and process manual bank payouts for loaded trips."
      />

      {/* COMMISSION & ADVANCE CONFIGURATION PANEL */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Platform Advance Split & Bounty Policy
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Governs customer advance collection and how funds are divided upon physical loading confirmation.
            </CardDescription>
          </div>
          {isConfigDirty && (
            <Button
              size="sm"
              onClick={() => updateConfigMutation.mutate()}
              disabled={updateConfigMutation.isPending}
              className="h-8 text-xs font-semibold gap-1.5"
            >
              {updateConfigMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Rules
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {isConfigLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Customer Advance (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={customerAdvance}
                    onChange={(e) => {
                      setCustomerAdvance(e.target.value);
                      setIsConfigDirty(true);
                    }}
                    className="h-9 font-bold"
                  />
                  <span className="absolute right-3 top-2 text-xs text-muted-foreground">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Collected to lock booking</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Platform Retention (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={platformRetention}
                    onChange={(e) => {
                      setPlatformRetention(e.target.value);
                      setIsConfigDirty(true);
                    }}
                    className="h-9 font-bold text-primary"
                  />
                  <span className="absolute right-3 top-2 text-xs text-muted-foreground">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">GoMyTruck platform fee</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Driver Advance (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={driverAdvance}
                    onChange={(e) => {
                      setDriverAdvance(e.target.value);
                      setIsConfigDirty(true);
                    }}
                    className="h-9 font-bold"
                  />
                  <span className="absolute right-3 top-2 text-xs text-muted-foreground">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Released on truck arrival</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Default Bounty (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-muted-foreground font-bold">₹</span>
                  <Input
                    type="number"
                    value={defaultBounty}
                    onChange={(e) => {
                      setDefaultBounty(e.target.value);
                      setIsConfigDirty(true);
                    }}
                    className="h-9 pl-7 font-bold text-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Fixed flat bounty per trip</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Retention Bonus (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-muted-foreground font-bold">₹</span>
                  <Input
                    type="number"
                    value={retentionBonus}
                    onChange={(e) => {
                      setRetentionBonus(e.target.value);
                      setIsConfigDirty(true);
                    }}
                    className="h-9 pl-7 font-bold text-blue-600"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">For 3 independent driver trips</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BOUNTIES & SETTLEMENTS LEDGER */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-600" />
              Manual Bounty Settlements Ledger
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Review bounties eligible for manual payout and log bank transfer UTR references.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ELIGIBLE">Eligible (Ready to Pay)</SelectItem>
                <SelectItem value="MANUALLY_SETTLED">Manually Settled</SelectItem>
                <SelectItem value="PENDING">Pending Loading</SelectItem>
                <SelectItem value="VOIDED">Voided (Dropout)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isBountiesFetching}
              className="h-8 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isBountiesFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Load & Route</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Transport Agent</TableHead>
              <TableHead className="text-right">Bounty Amount</TableHead>
              <TableHead>Settlement Status</TableHead>
              <TableHead>Eligible At</TableHead>
              <TableHead>Bank Ref / UTR</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isBountiesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : ledgers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No bounty ledger records found for the selected filter.
                </TableCell>
              </TableRow>
            ) : (
              ledgers.map((item: any) => {
                const isEligible = item.settlementStatus === "ELIGIBLE";
                const isSettled = item.settlementStatus === "MANUALLY_SETTLED";
                const isVoided = item.settlementStatus === "VOIDED";

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-semibold text-sm">
                        {item.quote?.load?.pickupCity} → {item.quote?.load?.dropCity}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">Load #{item.quote?.loadId?.slice(0, 8)}</div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {item.quote?.load?.vehicleType || "Commercial"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-sm">{item.quote?.broker?.user?.name || "Agent"}</div>
                      <div className="text-xs text-muted-foreground">{item.quote?.broker?.user?.phone}</div>
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-emerald-600 text-sm">
                      ₹{Number(item.bountyAmount || 0).toLocaleString("en-IN")}
                    </TableCell>

                    <TableCell>
                      {isEligible && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs gap-1">
                          <Clock className="h-3 w-3" /> Eligible (Ready)
                        </Badge>
                      )}
                      {isSettled && (
                        <Badge className="bg-green-100 text-green-700 border-green-300 text-xs gap-1">
                          <Check className="h-3 w-3" /> Settled
                        </Badge>
                      )}
                      {isVoided && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <XCircle className="h-3 w-3" /> Voided (Dropout)
                        </Badge>
                      )}
                      {!isEligible && !isSettled && !isVoided && (
                        <Badge variant="outline" className="text-xs">
                          {item.settlementStatus}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {item.eligibleAt ? new Date(item.eligibleAt).toLocaleDateString() : "—"}
                    </TableCell>

                    <TableCell className="text-xs font-mono">
                      {item.settlementRef ? (
                        <span className="font-semibold text-foreground">{item.settlementRef}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {isEligible ? (
                        <Button
                          size="sm"
                          className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => setSettleDialogTarget(item)}
                        >
                          Settle Payout
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {isSettled ? "Settled" : isVoided ? "Void" : "Waiting Load"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* PAGINATION FOOTER */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <div className="text-xs text-muted-foreground">
              Showing page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{meta.totalPages}</span> ({meta.total} records total)
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isBountiesFetching}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages || isBountiesFetching}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* SETTLE BOUNTY MANUAL PAYOUT DIALOG */}
      <Dialog open={!!settleDialogTarget} onOpenChange={(open) => !open && setSettleDialogTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Manual Bounty Settlement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agent:</span>
                <span className="font-semibold">{settleDialogTarget?.quote?.broker?.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-mono">{settleDialogTarget?.quote?.broker?.user?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bounty Amount:</span>
                <span className="font-bold text-emerald-600 text-base">₹{settleDialogTarget?.bountyAmount}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Ensure you have initiated the manual bank transfer (NEFT/IMPS/UPI) to the agent's verified account. Enter the transaction reference below to mark this bounty as settled.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs">Bank Transfer Reference / UTR Number <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. UTR123456789012"
                value={settlementRef}
                onChange={(e) => setSettlementRef(e.target.value)}
                className="h-9 text-xs font-mono font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes / Payout Method (Optional)</Label>
              <Textarea
                placeholder="e.g. Paid via ICICI Corporate Banking IMPS."
                value={settlementNotes}
                onChange={(e) => setSettlementNotes(e.target.value)}
                className="text-xs"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettleDialogTarget(null)}
              disabled={settleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!settlementRef.trim() || settleMutation.isPending}
              onClick={() => {
                settleMutation.mutate({
                  quoteId: settleDialogTarget.quoteId,
                  ref: settlementRef.trim(),
                  notes: settlementNotes.trim() || undefined,
                });
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {settleMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
              Confirm Manual Settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
