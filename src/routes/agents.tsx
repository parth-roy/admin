import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, ChevronLeft, ChevronRight, Loader2,
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Users,
  IndianRupee, Package, ArrowUpRight, Award, Truck, Check, RefreshCw
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

export const Route = createFileRoute("/agents")({
  head: () => ({ meta: [{ title: "Transport Agents — SUPER ADMIN" }] }),
  component: TransportAgentsPage,
});

export default function TransportAgentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [kycDialogTarget, setKycDialogTarget] = useState<any>(null);
  const [kycNotes, setKycNotes] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["adminAgents", page, debouncedSearch, kycFilter, cityFilter],
    queryFn: async () => {
      const res = await apiClient.get("/broker/admin/agents", {
        params: {
          page,
          limit: 25,
          search: debouncedSearch || undefined,
          isKycVerified: kycFilter === "all" ? undefined : kycFilter,
          city: cityFilter || undefined,
        },
      });
      return res.data;
    },
  });

  const kycMutation = useMutation({
    mutationFn: async ({ agentId, isKycVerified, notes }: { agentId: string; isKycVerified: boolean; notes?: string }) => {
      const res = await apiClient.patch(`/broker/admin/agents/${agentId}/kyc`, {
        isKycVerified,
        notes,
      });
      return res.data;
    },
    onSuccess: (res, vars) => {
      toast.success(vars.isKycVerified ? "Agent KYC Verified successfully" : "Agent KYC Revoked");
      queryClient.invalidateQueries({ queryKey: ["adminAgents"] });
      setKycDialogTarget(null);
      setKycNotes("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update KYC status");
    },
  });

  const agents = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const totalAgents = meta.total || 0;
  const verifiedCount = agents.filter((a: any) => a.isKycVerified).length;
  const totalBounties = agents.reduce((acc: number, curr: any) => acc + (curr.totalBountiesEarned || 0), 0);
  const totalFulfilled = agents.reduce((acc: number, curr: any) => acc + (curr.totalLoadsFulfilled || 0), 0);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Transport Agents (Digital Connectors)"
        subtitle="Manage registered freight agents, verify KYC documents, review sourcing KPIs, and track app migration rewards."
      />

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Agents
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground mt-1">Pan-India Transport Network</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              KYC Verified
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedCount} on page</div>
            <p className="text-xs text-muted-foreground mt-1">Authorized to quote loads</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Loads Fulfilled
            </CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFulfilled}</div>
            <p className="text-xs text-muted-foreground mt-1">Trips physically loaded</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bounties Credited
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalBounties.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1">Flat-fee agent earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & SEARCH BAR */}
      <Card className="border border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agent by name, phone, or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9"
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                value={kycFilter}
                onValueChange={(val) => {
                  setKycFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="KYC Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KYC Statuses</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="false">Pending Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-48">
              <Input
                placeholder="Filter by City..."
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AGENTS DATA TABLE */}
      <Card className="border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Operating Hub</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead className="text-center">Quotes</TableHead>
              <TableHead className="text-center">Fulfilled</TableHead>
              <TableHead className="text-center">Success Rate</TableHead>
              <TableHead className="text-center">Drivers Onboarded</TableHead>
              <TableHead className="text-right">Bounties Earned</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  No transport agents found matching the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent: any) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="font-semibold text-foreground">{agent.user?.name || (agent.user?.phone ? `Agent (${agent.user.phone.slice(-4)})` : "GMT Agent")}</div>
                    <div className="text-xs text-muted-foreground">{agent.user?.phone}</div>
                    {agent.user?.email && <div className="text-xs text-muted-foreground">{agent.user?.email}</div>}
                  </TableCell>

                  <TableCell>
                    <div className="font-medium text-sm">{agent.primaryCity || "Pan-India"}</div>
                    <div className="text-xs text-muted-foreground">{agent.primaryState || "India"}</div>
                  </TableCell>

                  <TableCell>
                    {agent.isKycVerified ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 text-xs gap-1">
                        <Check className="h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 text-xs gap-1">
                        <ShieldAlert className="h-3 w-3" /> Pending
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-center font-mono text-sm">
                    {agent.totalQuotesSubmitted || 0}
                  </TableCell>

                  <TableCell className="text-center font-mono font-bold text-sm text-foreground">
                    {agent.totalLoadsFulfilled || 0}
                  </TableCell>

                  <TableCell className="text-center font-mono text-sm">
                    <span className={agent.successRate > 50 ? "text-green-600 font-bold" : "text-muted-foreground"}>
                      {Number(agent.successRate || 0).toFixed(1)}%
                    </span>
                  </TableCell>

                  <TableCell className="text-center font-mono text-sm">
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                      <Truck className="h-3 w-3" /> {agent.driversOnboarded || 0}
                    </span>
                  </TableCell>

                  <TableCell className="text-right font-mono font-bold text-emerald-600">
                    ₹{Number(agent.totalBountiesEarned || 0).toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={agent.isKycVerified ? "outline" : "default"}
                      className="h-8 text-xs font-semibold"
                      onClick={() => setKycDialogTarget(agent)}
                    >
                      {agent.isKycVerified ? "Revoke KYC" : "Verify KYC"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* PAGINATION FOOTER */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <div className="text-xs text-muted-foreground">
              Showing page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{meta.totalPages}</span> ({meta.total} agents total)
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages || isFetching}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* KYC ACTION DIALOG */}
      <Dialog open={!!kycDialogTarget} onOpenChange={(open) => !open && setKycDialogTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {kycDialogTarget?.isKycVerified ? "Revoke KYC Verification" : "Approve Agent KYC Verification"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <div className="font-semibold">{kycDialogTarget?.user?.name || "Agent"}</div>
              <div className="text-xs text-muted-foreground">Phone: {kycDialogTarget?.user?.phone}</div>
              <div className="text-xs text-muted-foreground">Primary City: {kycDialogTarget?.primaryCity || "Not set"}</div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {kycDialogTarget?.isKycVerified
                ? "Revoking KYC will restrict this transport agent from submitting new driver quotes or earning bounties on open loads."
                : "Approving KYC confirms that the agent's identity and documents have been checked, granting them full quoting rights on open loads in their assigned territory."}
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs">Operational Notes / Reason (Optional)</Label>
              <Textarea
                placeholder="e.g. Verified Aadhaar and PAN card, authorized for East zone."
                value={kycNotes}
                onChange={(e) => setKycNotes(e.target.value)}
                className="text-xs"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKycDialogTarget(null)}
              disabled={kycMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={kycDialogTarget?.isKycVerified ? "destructive" : "default"}
              onClick={() => {
                kycMutation.mutate({
                  agentId: kycDialogTarget.id,
                  isKycVerified: !kycDialogTarget.isKycVerified,
                  notes: kycNotes,
                });
              }}
              disabled={kycMutation.isPending}
            >
              {kycMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
              {kycDialogTarget?.isKycVerified ? "Confirm Revocation" : "Approve & Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
