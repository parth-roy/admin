import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, ChevronLeft, ChevronRight, Loader2,
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Users,
  IndianRupee, Package, ArrowUpRight, Award, Truck, Check, RefreshCw,
  UserPlus, Download, Eye, Pencil, Trash2, Ban, Filter, X,
  ExternalLink, FileText, CreditCard, Building2, MapPin, GraduationCap,
  Camera, Phone, Mail, Copy, Shield, Sparkles, ZoomIn, CheckCheck
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiClient } from "@/lib/api/client";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { GoogleCityAutocomplete } from "@/components/admin/GoogleCityAutocomplete";
import { FileUploadDropzone } from "@/components/admin/FileUploadDropzone";

export const Route = createFileRoute("/agents/")({
  head: () => ({ meta: [{ title: "Manage Transport Agents — SUPER ADMIN" }] }),
  component: TransportAgentsPage,
});

function TransportAgentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialog targets
  const [kycDialogTarget, setKycDialogTarget] = useState<any>(null);
  const [kycNotes, setKycNotes] = useState("");
  const [detailDialogTarget, setDetailDialogTarget] = useState<any>(null);
  const [editDialogTarget, setEditDialogTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [statusDialogTarget, setStatusDialogTarget] = useState<any>(null);
  const [statusReason, setStatusReason] = useState("");
  const [deleteDialogTarget, setDeleteDialogTarget] = useState<any>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; isPdf?: boolean } | null>(null);

  const isDocImage = (url?: string | null) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (lower.startsWith("blob:") || lower.startsWith("data:image")) return true;
    const cleanUrl = lower.split("?")[0].split("#")[0];
    return (
      cleanUrl.endsWith(".png") ||
      cleanUrl.endsWith(".jpg") ||
      cleanUrl.endsWith(".jpeg") ||
      cleanUrl.endsWith(".webp") ||
      cleanUrl.endsWith(".gif") ||
      cleanUrl.endsWith(".svg") ||
      cleanUrl.endsWith(".avif") ||
      cleanUrl.endsWith(".bmp") ||
      lower.includes("image/") ||
      lower.includes("image")
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const debouncedSearch = useDebounce(search, 400);

  // Fetch agents list
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["adminAgents", page, debouncedSearch, kycFilter, activeFilter, cityFilter, sortBy, sortOrder],
    queryFn: async () => {
      const res = await apiClient.get("/broker/admin/agents", {
        params: {
          page,
          limit: 25,
          search: debouncedSearch || undefined,
          isKycVerified: kycFilter === "all" ? undefined : kycFilter,
          isActive: activeFilter === "all" ? undefined : activeFilter,
          city: cityFilter || undefined,
          sortBy,
          sortOrder,
        },
      });
      return res.data;
    },
  });

  // KYC Mutation
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

  // Edit Agent Mutation
  const editMutation = useMutation({
    mutationFn: async ({ agentId, data }: { agentId: string; data: any }) => {
      const res = await apiClient.patch(`/broker/admin/agents/${agentId}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Agent profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["adminAgents"] });
      setEditDialogTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update agent");
    },
  });

  // Status Toggle Mutation
  const statusMutation = useMutation({
    mutationFn: async ({ agentId, isActive, reason }: { agentId: string; isActive: boolean; reason?: string }) => {
      const res = await apiClient.patch(`/broker/admin/agents/${agentId}/status`, {
        isActive,
        reason,
      });
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? "Agent account activated" : "Agent account suspended");
      queryClient.invalidateQueries({ queryKey: ["adminAgents"] });
      setStatusDialogTarget(null);
      setStatusReason("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to change agent status");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await apiClient.delete(`/broker/admin/agents/${agentId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Agent deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminAgents"] });
      setDeleteDialogTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete agent");
    },
  });

  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiClient.post("/broker/admin/agents/bulk-delete", { ids });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Deleted ${data.data?.deletedCount ?? 0} agent(s). Skipped: ${data.data?.skippedCount ?? 0}`);
      queryClient.invalidateQueries({ queryKey: ["adminAgents"] });
      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to execute bulk delete");
    },
  });

  const agents = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };
  const totalAgents = meta.total || 0;

  const verifiedCount = agents.filter((a: any) => a.isKycVerified).length;
  const activeCount = agents.filter((a: any) => a.isActive !== false).length;
  const totalBounties = agents.reduce((acc: number, curr: any) => acc + (curr.totalBountiesEarned || 0), 0);
  const totalFulfilled = agents.reduce((acc: number, curr: any) => acc + (curr.totalLoadsFulfilled || 0), 0);

  // Checkbox handlers
  const pageIds = agents.map((a: any) => a.id);
  const isAllPageSelected = pageIds.length > 0 && pageIds.every((id: string) => selectedIds.has(id));

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (isAllPageSelected) {
      pageIds.forEach((id: string) => next.delete(id));
    } else {
      pageIds.forEach((id: string) => next.add(id));
    }
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const resetFilters = () => {
    setSearch("");
    setKycFilter("all");
    setActiveFilter("all");
    setCityFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
    setSelectedIds(new Set());
  };

  const openEdit = (agent: any) => {
    setEditDialogTarget(agent);
    setEditForm({
      name: agent.user?.name || "",
      email: agent.user?.email || "",
      primaryCity: agent.primaryCity || "",
      primaryState: agent.primaryState || "",
      operatingCitiesInput: (agent.operatingCities || []).join(", "),
      age: agent.age ? String(agent.age) : "",
      gender: agent.gender || "",
      educationLevel: agent.educationLevel || "",
      fullAddress: agent.fullAddress || "",
      profilePhotoUrl: agent.profilePhotoUrl || "",
      aadhaarNumber: agent.aadhaarNumber || "",
      aadhaarDocUrl: agent.aadhaarDocUrl || "",
      panNumber: agent.panNumber || "",
      panDocUrl: agent.panDocUrl || "",
      bankAccountNumber: agent.bankAccountNumber || "",
      bankIfsc: agent.bankIfsc || "",
      bankName: agent.bankName || "",
      bankAccountHolderName: agent.bankAccountHolderName || "",
      bankUpiId: agent.bankUpiId || "",
      adminNotes: agent.adminNotes || "",
    });
  };

  const exportCsv = () => {
    if (agents.length === 0) {
      toast.warning("No agents to export");
      return;
    }
    const headers = ["ID", "Name", "Phone", "Email", "Primary City", "KYC Status", "Account Status", "Quotes", "Fulfilled", "Success Rate (%)", "Bounties Earned (INR)", "Joined Date"];
    const rows = agents.map((a: any) => [
      `"${a.id}"`,
      `"${a.user?.name || ""}"`,
      `"${a.user?.phone || ""}"`,
      `"${a.user?.email || ""}"`,
      `"${a.primaryCity || ""}"`,
      `"${a.isKycVerified ? "Verified" : "Pending"}"`,
      `"${a.isActive !== false ? "Active" : "Suspended"}"`,
      a.totalQuotesSubmitted || 0,
      a.totalLoadsFulfilled || 0,
      a.successRate || 0,
      a.totalBountiesEarned || 0,
      `"${new Date(a.createdAt).toLocaleDateString("en-IN")}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gomytruck-transport-agents-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Agents CSV exported successfully");
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER WITH ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title="Transport Agents Management"
          description="Manage authorized freight agents, verify KYC documents, review sourcing KPIs, and track payout ledger records."
        />
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Link to="/agents/payouts">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
              Agent Payouts
            </Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="h-9 gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Link to="/agents/register">
              <UserPlus className="h-4 w-4" />
              Register Agent
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Agents
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground mt-1">Pan-India Network</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              KYC Verified
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedCount} on page</div>
            <p className="text-xs text-muted-foreground mt-1">Authorized for bidding</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Accounts
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeCount} on page</div>
            <p className="text-xs text-muted-foreground mt-1">Active portal access</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Loads Fulfilled
            </CardTitle>
            <Truck className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFulfilled}</div>
            <p className="text-xs text-muted-foreground mt-1">Physically loaded trips</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bounties Credited
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">₹{totalBounties.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1">Flat-fee agent payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by agent name, phone, email, PAN, code, or city..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9"
              />
            </div>

            <Select
              value={kycFilter}
              onValueChange={(val) => {
                setKycFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC Statuses</SelectItem>
                <SelectItem value="verified">KYC Verified</SelectItem>
                <SelectItem value="false">Pending Review</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={activeFilter}
              onValueChange={(val) => {
                setActiveFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Account Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Filter City..."
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setPage(1);
              }}
              className="w-[150px] h-9"
            />

            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Newest Joined</SelectItem>
                <SelectItem value="totalLoadsFulfilled">Most Fulfilled</SelectItem>
                <SelectItem value="totalBountiesEarned">Highest Bounties</SelectItem>
                <SelectItem value="successRate">Highest Success %</SelectItem>
                <SelectItem value="name">Agent Name</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 px-3"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>

            {(search || kycFilter !== "all" || activeFilter !== "all" || cityFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {/* BULK ACTION BAR */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <span>{selectedIds.size} agent(s) selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs px-2.5 gap-1"
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Bulk Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-muted-foreground"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DATA TABLE */}
      <Card className="border border-border shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={isAllPageSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Operating Hub</TableHead>
              <TableHead>Demographics</TableHead>
              <TableHead>KYC</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Quotes</TableHead>
              <TableHead className="text-center">Fulfilled</TableHead>
              <TableHead className="text-center">Success %</TableHead>
              <TableHead className="text-right">Bounties</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="font-semibold text-sm">No transport agents found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Try adjusting filters or register a new agent.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="mt-4 text-xs font-semibold"
                    >
                      <Link to="/agents/register">
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Register New Agent
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent: any) => {
                const isSelected = selectedIds.has(agent.id);
                const name = agent.user?.name || (agent.user?.phone ? `Agent (${agent.user.phone.slice(-4)})` : "GMT Agent");
                const initials = name.slice(0, 2).toUpperCase();

                return (
                  <TableRow key={agent.id} className={isSelected ? "bg-primary/5" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectOne(agent.id)}
                        aria-label={`Select ${name}`}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 text-xs font-bold border border-border shadow-xs shrink-0">
                          {agent.profilePhotoUrl && (
                            <AvatarImage
                              src={agent.profilePhotoUrl}
                              alt={name}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{name}</span>
                            {agent.referralCode && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono text-muted-foreground">
                                {agent.referralCode}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">{agent.user?.phone}</div>
                          {agent.user?.email && (
                            <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                              {agent.user.email}
                            </div>
                          )}

                          {/* Mini Document Status Indicators */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                agent.profilePhotoUrl
                                  ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                                  : "bg-muted text-muted-foreground/70"
                              }`}
                              title={agent.profilePhotoUrl ? "Profile photo uploaded" : "Profile photo missing"}
                            >
                              <Camera className="h-2.5 w-2.5" /> Photo
                            </span>

                            <span
                              className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                agent.aadhaarDocUrl
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  : "bg-muted text-muted-foreground/70"
                              }`}
                              title={agent.aadhaarDocUrl ? "Aadhaar document uploaded" : "Aadhaar document missing"}
                            >
                              <FileText className="h-2.5 w-2.5" /> Aadhaar
                            </span>

                            <span
                              className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                agent.panDocUrl
                                  ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                  : "bg-muted text-muted-foreground/70"
                              }`}
                              title={agent.panDocUrl ? "PAN card uploaded" : "PAN card missing"}
                            >
                              <CreditCard className="h-2.5 w-2.5" /> PAN
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-xs text-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{agent.primaryCity || "Pan-India"}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {agent.primaryState || "India"}
                      </div>
                      {agent.operatingCities && agent.operatingCities.length > 1 && (
                        <div className="text-[10px] text-blue-600 mt-0.5">
                          +{agent.operatingCities.length - 1} more hubs
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-medium capitalize">
                        {agent.gender ? agent.gender.toLowerCase() : "—"}{agent.age ? `, ${agent.age}y` : ""}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[110px] capitalize">
                        {agent.educationLevel ? agent.educationLevel.replace(/_/g, " ").toLowerCase() : "Not specified"}
                      </div>
                    </TableCell>

                    <TableCell>
                      {agent.isKycVerified ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 text-[11px] gap-1 py-0.5">
                          <Check className="h-3 w-3" /> Verified
                        </Badge>
                      ) : (agent.aadhaarDocUrl || agent.panDocUrl) ? (
                        <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 text-[11px] gap-1 py-0.5" title="Documents uploaded, awaiting admin review">
                          <FileText className="h-3 w-3" /> Review Docs
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 text-[11px] gap-1 py-0.5">
                          <ShieldAlert className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {agent.isActive !== false ? (
                        <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[11px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[11px]">
                          Suspended
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-center font-mono font-bold text-xs text-foreground">
                      {agent.totalQuotesSubmitted ?? agent._count?.quotes ?? 0}
                    </TableCell>

                    <TableCell className="text-center font-mono font-bold text-xs text-foreground">
                      {agent.totalLoadsFulfilled || 0}
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs">
                      <span className={agent.successRate > 50 ? "text-green-600 font-bold" : "text-muted-foreground"}>
                        {Number(agent.successRate || 0).toFixed(0)}%
                      </span>
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-xs text-emerald-600">
                      ₹{Number(agent.totalBountiesEarned || 0).toLocaleString("en-IN")}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="View Full Profile & Sourcing Details"
                          onClick={() => {
                            setDetailDialogTarget(agent);
                            setKycNotes(agent.adminNotes || "");
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Edit Agent Information"
                          onClick={() => openEdit(agent)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className={`h-7 w-7 ${agent.isKycVerified ? "text-green-600 hover:text-amber-600" : "text-amber-600 hover:text-green-600"}`}
                          title={agent.isKycVerified ? "Revoke KYC" : "Verify KYC"}
                          onClick={() => {
                            setKycDialogTarget(agent);
                            setKycNotes(agent.adminNotes || "");
                          }}
                        >
                          {agent.isKycVerified ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className={`h-7 w-7 ${agent.isActive !== false ? "text-muted-foreground hover:text-red-500" : "text-red-500 hover:text-green-600"}`}
                          title={agent.isActive !== false ? "Suspend Account" : "Activate Account"}
                          onClick={() => setStatusDialogTarget(agent)}
                        >
                          {agent.isActive !== false ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Delete Agent"
                          onClick={() => setDeleteDialogTarget(agent)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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

      {/* DETAIL MODAL WITH TABS */}
      <Dialog open={!!detailDialogTarget} onOpenChange={(open) => !open && setDetailDialogTarget(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0">
          {detailDialogTarget && (
            <div>
              {/* DIALOG HEADER HERO BANNER */}
              <div className="bg-gradient-to-r from-muted/70 via-muted/40 to-background p-6 border-b border-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-border shadow-md rounded-full shrink-0">
                      {detailDialogTarget.profilePhotoUrl && (
                        <AvatarImage
                          src={detailDialogTarget.profilePhotoUrl}
                          alt={detailDialogTarget.user?.name || "Agent"}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {(detailDialogTarget.user?.name || "AG").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-foreground">
                          {detailDialogTarget.user?.name || "Transport Agent"}
                        </h2>
                        {detailDialogTarget.referralCode && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {detailDialogTarget.referralCode}
                          </Badge>
                        )}
                        {detailDialogTarget.isKycVerified ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-xs">
                            <Check className="h-3 w-3" /> KYC Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 gap-1 text-xs">
                            <ShieldAlert className="h-3 w-3" /> KYC Pending
                          </Badge>
                        )}
                        {detailDialogTarget.isActive !== false ? (
                          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Suspended</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {detailDialogTarget.user?.phone}
                        </span>
                        {detailDialogTarget.user?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {detailDialogTarget.user.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {detailDialogTarget.primaryCity} ({detailDialogTarget.primaryState || "India"})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const target = detailDialogTarget;
                        setDetailDialogTarget(null);
                        openEdit(target);
                      }}
                      className="h-8 text-xs gap-1.5 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Profile
                    </Button>
                    <Button
                      size="sm"
                      variant={detailDialogTarget.isKycVerified ? "destructive" : "default"}
                      className="h-8 text-xs gap-1.5 cursor-pointer"
                      disabled={kycMutation.isPending}
                      onClick={() => {
                        const nextKyc = !detailDialogTarget.isKycVerified;
                        kycMutation.mutate(
                          {
                            agentId: detailDialogTarget.id,
                            isKycVerified: nextKyc,
                            notes: kycNotes || detailDialogTarget.adminNotes,
                          },
                          {
                            onSuccess: () => {
                              setDetailDialogTarget((prev: any) => ({
                                ...prev,
                                isKycVerified: nextKyc,
                                kycVerifiedAt: nextKyc ? new Date().toISOString() : null,
                              }));
                            },
                          }
                        );
                      }}
                    >
                      {detailDialogTarget.isKycVerified ? (
                        <>
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Revoke KYC
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verify KYC
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* TABS CONTAINER */}
              <div className="p-6">
                <Tabs defaultValue="docs" className="w-full">
                  <TabsList className="grid grid-cols-4 w-full mb-4">
                    <TabsTrigger value="docs" className="text-xs font-semibold gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Documents & KYC
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="text-xs font-semibold gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Profile & Demographics
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="text-xs font-semibold gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" /> Bank & Payouts
                    </TabsTrigger>
                    <TabsTrigger value="kpis" className="text-xs font-semibold gap-1.5">
                      <Award className="h-3.5 w-3.5" /> Sourcing KPIs
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB 1: DOCUMENTS & KYC */}
                  <TabsContent value="docs" className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* CARD 1: PROFILE PHOTO */}
                      <Card className="border border-border/80 shadow-xs overflow-hidden flex flex-col">
                        <CardHeader className="p-3.5 pb-2 bg-muted/20 border-b border-border/40">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold flex items-center gap-1.5">
                              <Camera className="h-3.5 w-3.5 text-purple-500" />
                              Profile Photo
                            </span>
                            {detailDialogTarget.profilePhotoUrl ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] py-0">
                                Uploaded
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px] py-0">
                                Missing
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-3.5 flex-1 flex flex-col justify-between">
                          {detailDialogTarget.profilePhotoUrl ? (
                            <div className="space-y-2.5">
                              <div
                                onClick={() =>
                                  setPreviewDoc({
                                    title: `${detailDialogTarget.user?.name || "Agent"} — Profile Photo`,
                                    url: detailDialogTarget.profilePhotoUrl,
                                    isPdf: false,
                                  })
                                }
                                className="relative h-48 w-full rounded-lg overflow-hidden border border-border/60 bg-muted/30 flex items-center justify-center cursor-pointer group"
                              >
                                <img
                                  src={detailDialogTarget.profilePhotoUrl}
                                  alt="Agent Profile Photo"
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                                  <Eye className="h-4 w-4" /> Click to Zoom / Inspect
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs pt-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-primary"
                                  onClick={() =>
                                    setPreviewDoc({
                                      title: `${detailDialogTarget.user?.name || "Agent"} — Profile Photo`,
                                      url: detailDialogTarget.profilePhotoUrl,
                                      isPdf: false,
                                    })
                                  }
                                >
                                  <Eye className="h-3 w-3 mr-1" /> Inspect
                                </Button>
                                <a
                                  href={detailDialogTarget.profilePhotoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                                >
                                  <ExternalLink className="h-3 w-3" /> Full File
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="h-48 rounded-lg border-2 border-dashed border-border/80 flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                              <Camera className="h-8 w-8 mb-2 opacity-40" />
                              <p className="text-xs font-medium">No Profile Photo Uploaded</p>
                              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                                Edit agent profile to upload passport photograph.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* CARD 2: AADHAAR CARD */}
                      <Card className="border border-border/80 shadow-xs overflow-hidden flex flex-col">
                        <CardHeader className="p-3.5 pb-2 bg-muted/20 border-b border-border/40">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-emerald-500" />
                              Aadhaar Card
                            </span>
                            {detailDialogTarget.aadhaarDocUrl ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] py-0">
                                Uploaded
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px] py-0">
                                Missing
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-3.5 flex-1 flex flex-col justify-between">
                          <div className="mb-2 text-xs">
                            <span className="text-muted-foreground">Aadhaar Number: </span>
                            <span className="font-semibold font-mono text-foreground">
                              {detailDialogTarget.aadhaarNumber
                                ? `•••• •••• ${detailDialogTarget.aadhaarNumber.slice(-4)}`
                                : detailDialogTarget.aadhaarLast4
                                ? `•••• •••• ${detailDialogTarget.aadhaarLast4}`
                                : "Not recorded"}
                            </span>
                          </div>

                          {detailDialogTarget.aadhaarDocUrl ? (
                            <div className="space-y-2.5">
                              {isDocImage(detailDialogTarget.aadhaarDocUrl) ? (
                                <div
                                  onClick={() =>
                                    setPreviewDoc({
                                      title: `${detailDialogTarget.user?.name || "Agent"} — Aadhaar Card Document`,
                                      url: detailDialogTarget.aadhaarDocUrl,
                                      isPdf: false,
                                    })
                                  }
                                  className="relative h-48 w-full rounded-lg overflow-hidden border border-border/60 bg-muted/30 flex items-center justify-center cursor-pointer group"
                                >
                                  <img
                                    src={detailDialogTarget.aadhaarDocUrl}
                                    alt="Aadhaar Card"
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                                    <Eye className="h-4 w-4" /> Click to Zoom / Inspect
                                  </div>
                                </div>
                              ) : (
                                <div className="h-48 rounded-lg border border-border/80 bg-red-500/5 flex flex-col items-center justify-center p-4 text-center">
                                  <FileText className="h-12 w-12 text-red-500 mb-2" />
                                  <p className="text-xs font-semibold text-foreground">Aadhaar PDF Document</p>
                                  <p className="text-[11px] text-muted-foreground mb-3">Portable Document Format</p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={() =>
                                      setPreviewDoc({
                                        title: `${detailDialogTarget.user?.name || "Agent"} — Aadhaar Card (PDF)`,
                                        url: detailDialogTarget.aadhaarDocUrl,
                                        isPdf: true,
                                      })
                                    }
                                  >
                                    <Eye className="h-3.5 w-3.5" /> Open PDF Viewer
                                  </Button>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-xs pt-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-primary"
                                  onClick={() =>
                                    setPreviewDoc({
                                      title: `${detailDialogTarget.user?.name || "Agent"} — Aadhaar Card`,
                                      url: detailDialogTarget.aadhaarDocUrl,
                                      isPdf: !isDocImage(detailDialogTarget.aadhaarDocUrl),
                                    })
                                  }
                                >
                                  <Eye className="h-3 w-3 mr-1" /> Inspect
                                </Button>
                                <a
                                  href={detailDialogTarget.aadhaarDocUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                                >
                                  <ExternalLink className="h-3 w-3" /> Full File
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="h-48 rounded-lg border-2 border-dashed border-border/80 flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                              <FileText className="h-8 w-8 mb-2 opacity-40" />
                              <p className="text-xs font-medium">No Aadhaar Document Uploaded</p>
                              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                                Agent has not attached Aadhaar card scan.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* CARD 3: PAN CARD */}
                      <Card className="border border-border/80 shadow-xs overflow-hidden flex flex-col">
                        <CardHeader className="p-3.5 pb-2 bg-muted/20 border-b border-border/40">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold flex items-center gap-1.5">
                              <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                              PAN Card
                            </span>
                            {detailDialogTarget.panDocUrl ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] py-0">
                                Uploaded
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px] py-0">
                                Missing
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-3.5 flex-1 flex flex-col justify-between">
                          <div className="mb-2 text-xs">
                            <span className="text-muted-foreground">PAN Number: </span>
                            <span className="font-semibold font-mono text-foreground">
                              {detailDialogTarget.panNumber || "Not recorded"}
                            </span>
                          </div>

                          {detailDialogTarget.panDocUrl ? (
                            <div className="space-y-2.5">
                              {isDocImage(detailDialogTarget.panDocUrl) ? (
                                <div
                                  onClick={() =>
                                    setPreviewDoc({
                                      title: `${detailDialogTarget.user?.name || "Agent"} — PAN Card Document`,
                                      url: detailDialogTarget.panDocUrl,
                                      isPdf: false,
                                    })
                                  }
                                  className="relative h-48 w-full rounded-lg overflow-hidden border border-border/60 bg-muted/30 flex items-center justify-center cursor-pointer group"
                                >
                                  <img
                                    src={detailDialogTarget.panDocUrl}
                                    alt="PAN Card"
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                                    <Eye className="h-4 w-4" /> Click to Zoom / Inspect
                                  </div>
                                </div>
                              ) : (
                                <div className="h-48 rounded-lg border border-border/80 bg-red-500/5 flex flex-col items-center justify-center p-4 text-center">
                                  <FileText className="h-12 w-12 text-red-500 mb-2" />
                                  <p className="text-xs font-semibold text-foreground">PAN PDF Document</p>
                                  <p className="text-[11px] text-muted-foreground mb-3">Portable Document Format</p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={() =>
                                      setPreviewDoc({
                                        title: `${detailDialogTarget.user?.name || "Agent"} — PAN Card (PDF)`,
                                        url: detailDialogTarget.panDocUrl,
                                        isPdf: true,
                                      })
                                    }
                                  >
                                    <Eye className="h-3.5 w-3.5" /> Open PDF Viewer
                                  </Button>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-xs pt-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-primary"
                                  onClick={() =>
                                    setPreviewDoc({
                                      title: `${detailDialogTarget.user?.name || "Agent"} — PAN Card`,
                                      url: detailDialogTarget.panDocUrl,
                                      isPdf: !isDocImage(detailDialogTarget.panDocUrl),
                                    })
                                  }
                                >
                                  <Eye className="h-3 w-3 mr-1" /> Inspect
                                </Button>
                                <a
                                  href={detailDialogTarget.panDocUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                                >
                                  <ExternalLink className="h-3 w-3" /> Full File
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="h-48 rounded-lg border-2 border-dashed border-border/80 flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                              <CreditCard className="h-8 w-8 mb-2 opacity-40" />
                              <p className="text-xs font-medium">No PAN Document Uploaded</p>
                              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                                Agent has not attached PAN card scan.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* INLINE KYC VERIFICATION & AUDIT DECISION BAR */}
                    <div className="rounded-xl border border-border bg-muted/20 p-4 shadow-xs space-y-3 mt-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            KYC Verification Decision & Compliance Remarks
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Cross-verify document numbers against identity scans above before verifying.
                          </p>
                        </div>
                        <div>
                          {detailDialogTarget.isKycVerified ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-xs">
                              <Check className="h-3 w-3" /> Status: Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 gap-1 text-xs">
                              <ShieldAlert className="h-3 w-3" /> Status: Pending Verification
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="inlineKycNotes" className="text-xs font-medium">
                          Admin Verification Notes / Audit Remarks
                        </Label>
                        <Textarea
                          id="inlineKycNotes"
                          rows={2}
                          placeholder="e.g. Verified Aadhaar last 4 and PAN with government portal. Photo matches identity proofs."
                          value={kycNotes}
                          onChange={(e) => setKycNotes(e.target.value)}
                          className="text-xs bg-background"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        {detailDialogTarget.isKycVerified ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={kycMutation.isPending}
                            onClick={() => {
                              kycMutation.mutate(
                                {
                                  agentId: detailDialogTarget.id,
                                  isKycVerified: false,
                                  notes: kycNotes,
                                },
                                {
                                  onSuccess: () => {
                                    setDetailDialogTarget((prev: any) => ({
                                      ...prev,
                                      isKycVerified: false,
                                      adminNotes: kycNotes,
                                    }));
                                  },
                                }
                              );
                            }}
                            className="text-xs h-8 gap-1.5 cursor-pointer"
                          >
                            {kycMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                            Revoke Verification
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={kycMutation.isPending}
                            onClick={() => {
                              kycMutation.mutate(
                                {
                                  agentId: detailDialogTarget.id,
                                  isKycVerified: true,
                                  notes: kycNotes,
                                },
                                {
                                  onSuccess: () => {
                                    setDetailDialogTarget((prev: any) => ({
                                      ...prev,
                                      isKycVerified: true,
                                      kycVerifiedAt: new Date().toISOString(),
                                      adminNotes: kycNotes,
                                    }));
                                  },
                                }
                              );
                            }}
                            className="text-xs h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                          >
                            {kycMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Approve & Verify Agent KYC
                          </Button>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 2: PROFILE & DEMOGRAPHICS */}
                  <TabsContent value="profile" className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Full Name:</span>
                        <p className="font-semibold text-sm text-foreground mt-0.5">{detailDialogTarget.user?.name || "—"}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Mobile Phone:</span>
                        <p className="font-semibold text-sm text-foreground mt-0.5 font-mono">{detailDialogTarget.user?.phone || "—"}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Email Address:</span>
                        <p className="font-semibold text-foreground mt-0.5">{detailDialogTarget.user?.email || "—"}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Referral Code:</span>
                        <p className="font-semibold text-foreground mt-0.5 font-mono">{detailDialogTarget.referralCode || "—"}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Age & Gender:</span>
                        <p className="font-semibold text-foreground mt-0.5">
                          {detailDialogTarget.age ? `${detailDialogTarget.age} Years` : "—"}, {detailDialogTarget.gender || "—"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Education Qualification:</span>
                        <p className="font-semibold text-foreground mt-0.5">
                          {detailDialogTarget.educationLevel ? detailDialogTarget.educationLevel.replace(/_/g, " ") : "Not specified"}
                        </p>
                      </div>
                      <div className="col-span-1 md:col-span-2 p-3 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Operating Territories:</span>
                        <p className="font-semibold text-foreground mt-0.5">
                          {detailDialogTarget.primaryCity} ({detailDialogTarget.primaryState || "India"})
                          {detailDialogTarget.operatingCities?.length > 1 && ` • Additional Freight Hubs: ${detailDialogTarget.operatingCities.join(", ")}`}
                        </p>
                      </div>
                      <div className="col-span-1 md:col-span-2 p-3 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Full Address:</span>
                        <p className="font-semibold text-foreground mt-0.5">{detailDialogTarget.fullAddress || "Not provided"}</p>
                      </div>
                      <div className="col-span-1 md:col-span-2 p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
                        <div>
                          <span className="text-muted-foreground">Registration Date:</span>
                          <p className="font-semibold text-foreground mt-0.5">
                            {new Date(detailDialogTarget.createdAt).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground">Agent ID:</span>
                          <p className="font-mono text-muted-foreground text-[11px] mt-0.5">{detailDialogTarget.id}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 3: BANK DETAILS */}
                  <TabsContent value="bank" className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Account Holder:</span>
                        <p className="font-semibold text-sm mt-0.5">{detailDialogTarget.bankAccountHolderName || "—"}</p>
                      </div>
                      <div className="p-3.5 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Bank Name:</span>
                        <p className="font-semibold text-sm mt-0.5">{detailDialogTarget.bankName || "—"}</p>
                      </div>
                      <div className="p-3.5 rounded-lg border border-border bg-card flex items-center justify-between">
                        <div>
                          <span className="text-muted-foreground">Account Number:</span>
                          <p className="font-semibold font-mono text-sm mt-0.5">{detailDialogTarget.bankAccountNumber || "—"}</p>
                        </div>
                        {detailDialogTarget.bankAccountNumber && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => copyToClipboard(detailDialogTarget.bankAccountNumber, "Account Number")}
                            title="Copy Account Number"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="p-3.5 rounded-lg border border-border bg-card flex items-center justify-between">
                        <div>
                          <span className="text-muted-foreground">IFSC Code:</span>
                          <p className="font-semibold font-mono text-sm mt-0.5">{detailDialogTarget.bankIfsc || "—"}</p>
                        </div>
                        {detailDialogTarget.bankIfsc && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => copyToClipboard(detailDialogTarget.bankIfsc, "IFSC Code")}
                            title="Copy IFSC Code"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="col-span-1 md:col-span-2 p-3.5 rounded-lg border border-border bg-card flex items-center justify-between">
                        <div>
                          <span className="text-muted-foreground">UPI ID (VPA):</span>
                          <p className="font-semibold font-mono text-sm mt-0.5 text-primary">{detailDialogTarget.bankUpiId || "—"}</p>
                        </div>
                        {detailDialogTarget.bankUpiId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => copyToClipboard(detailDialogTarget.bankUpiId, "UPI ID")}
                            title="Copy UPI ID"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="col-span-1 md:col-span-2 p-3 rounded-lg border border-border bg-muted/20 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {detailDialogTarget.bankAccountNumber || detailDialogTarget.bankUpiId
                            ? "✅ Agent is configured for direct manual bounty settlements via Bank Transfer / UPI."
                            : "⚠️ No bank account or UPI ID configured. Complete banking details before settling bounties."}
                        </span>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 4: SOURCING KPIS */}
                  <TabsContent value="kpis" className="space-y-4 pt-1">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-center text-xs">
                      <div className="p-3.5 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Quotes Submitted</span>
                        <p className="font-bold text-xl text-foreground mt-1">{detailDialogTarget.totalQuotesSubmitted || 0}</p>
                      </div>
                      <div className="p-3.5 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Loads Fulfilled</span>
                        <p className="font-bold text-xl text-foreground mt-1">{detailDialogTarget.totalLoadsFulfilled || 0}</p>
                      </div>
                      <div className="p-3.5 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Success Rate</span>
                        <p className="font-bold text-xl text-green-600 mt-1">{Number(detailDialogTarget.successRate || 0).toFixed(1)}%</p>
                      </div>
                      <div className="p-3.5 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Total Bounties</span>
                        <p className="font-bold text-xl text-emerald-600 mt-1">₹{Number(detailDialogTarget.totalBountiesEarned || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div className="p-3.5 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Drivers Onboarded</span>
                        <p className="font-bold text-xl text-blue-600 mt-1">{detailDialogTarget.driversOnboarded || 0}</p>
                      </div>
                      <div className="p-3.5 rounded-lg border border-border bg-card">
                        <span className="text-muted-foreground">Micro-Commissions</span>
                        <p className="font-bold text-xl text-foreground mt-1">₹{Number(detailDialogTarget.microCommissionBonus || 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-end">
                <Button variant="outline" size="sm" onClick={() => setDetailDialogTarget(null)} className="h-8 text-xs cursor-pointer">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT AGENT DIALOG */}
      <Dialog open={!!editDialogTarget} onOpenChange={(open) => !open && setEditDialogTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transport Agent</DialogTitle>
            <DialogDescription className="text-xs">
              Update contact details, operating hubs, demographic profile, and banking credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={editForm.name || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                value={editForm.email || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Primary City</Label>
              <GoogleCityAutocomplete
                value={editForm.primaryCity || ""}
                onChange={(city) => setEditForm((p: any) => ({ ...p, primaryCity: city }))}
                onCitySelect={(details) => {
                  setEditForm((p: any) => ({
                    ...p,
                    primaryCity: details.city,
                    primaryState: details.state || p.primaryState,
                  }));
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Primary State</Label>
              <Input
                value={editForm.primaryState || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, primaryState: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Operating Cities (Comma Separated)</Label>
              <Input
                value={editForm.operatingCitiesInput || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, operatingCitiesInput: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Age</Label>
              <Input
                type="number"
                value={editForm.age || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, age: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gender</Label>
              <Select
                value={editForm.gender || ""}
                onValueChange={(val) => setEditForm((p: any) => ({ ...p, gender: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Full Address</Label>
              <Input
                value={editForm.fullAddress || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, fullAddress: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <FileUploadDropzone
                id="editProfilePhoto"
                label="Profile Photo"
                value={editForm.profilePhotoUrl || ""}
                onChange={(url) => setEditForm((p: any) => ({ ...p, profilePhotoUrl: url }))}
                folder="profile"
                mode="avatar"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                maxSizeMb={5}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Aadhaar Number</Label>
              <Input
                value={editForm.aadhaarNumber || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, aadhaarNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <FileUploadDropzone
                id="editAadhaarDoc"
                label="Aadhaar Document"
                value={editForm.aadhaarDocUrl || ""}
                onChange={(url) => setEditForm((p: any) => ({ ...p, aadhaarDocUrl: url }))}
                folder="documents"
                mode="document"
                accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">PAN Number</Label>
              <Input
                value={editForm.panNumber || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-1">
              <FileUploadDropzone
                id="editPanDoc"
                label="PAN Card Document"
                value={editForm.panDocUrl || ""}
                onChange={(url) => setEditForm((p: any) => ({ ...p, panDocUrl: url }))}
                folder="documents"
                mode="document"
                accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Bank Name</Label>
              <Input
                value={editForm.bankName || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, bankName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Account Holder</Label>
              <Input
                value={editForm.bankAccountHolderName || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, bankAccountHolderName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Account Number</Label>
              <Input
                value={editForm.bankAccountNumber || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, bankAccountNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">IFSC Code</Label>
              <Input
                value={editForm.bankIfsc || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, bankIfsc: e.target.value.toUpperCase() }))}
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Admin Notes</Label>
              <Textarea
                rows={2}
                value={editForm.adminNotes || ""}
                onChange={(e) => setEditForm((p: any) => ({ ...p, adminNotes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditDialogTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={editMutation.isPending}
              onClick={() => {
                const operatingCities = editForm.operatingCitiesInput
                  ? editForm.operatingCitiesInput.split(",").map((s: string) => s.trim()).filter(Boolean)
                  : undefined;
                editMutation.mutate({
                  agentId: editDialogTarget.id,
                  data: {
                    ...editForm,
                    age: editForm.age ? Number(editForm.age) : undefined,
                    operatingCities,
                  },
                });
              }}
            >
              {editMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KYC ACTION DIALOG */}
      <Dialog open={!!kycDialogTarget} onOpenChange={(open) => !open && setKycDialogTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {kycDialogTarget?.isKycVerified ? "Revoke Agent KYC" : "Verify Agent KYC"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {kycDialogTarget?.isKycVerified
                ? "Revoking KYC will temporarily prevent this agent from submitting new quotes on open loads."
                : "Verifying KYC approves this agent to actively submit driver quotes and earn loading bounties."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-muted/40 rounded-lg space-y-1">
              <div className="font-semibold text-foreground">
                {kycDialogTarget?.user?.name || kycDialogTarget?.user?.phone}
              </div>
              <div className="text-muted-foreground">{kycDialogTarget?.primaryCity || "Pan-India"}</div>
              {kycDialogTarget?.panNumber && (
                <div className="font-mono text-muted-foreground">PAN: {kycDialogTarget.panNumber}</div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Verification / Action Notes</Label>
              <Textarea
                placeholder="Optional notes or reason for this status change..."
                value={kycNotes}
                onChange={(e) => setKycNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setKycDialogTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={kycDialogTarget?.isKycVerified ? "destructive" : "default"}
              disabled={kycMutation.isPending}
              onClick={() => {
                kycMutation.mutate({
                  agentId: kycDialogTarget.id,
                  isKycVerified: !kycDialogTarget.isKycVerified,
                  notes: kycNotes,
                });
              }}
            >
              {kycMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              {kycDialogTarget?.isKycVerified ? "Revoke KYC" : "Approve & Verify KYC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ACCOUNT STATUS DIALOG */}
      <Dialog open={!!statusDialogTarget} onOpenChange={(open) => !open && setStatusDialogTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusDialogTarget?.isActive !== false ? "Suspend Agent Account" : "Activate Agent Account"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {statusDialogTarget?.isActive !== false
                ? "Suspending this agent will block portal access and prevent active quoting."
                : "Activating this agent will restore their ability to log in and participate in freight sourcing."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reason for Status Change</Label>
              <Textarea
                placeholder="Enter internal reason for record keeping..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setStatusDialogTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={statusDialogTarget?.isActive !== false ? "destructive" : "default"}
              disabled={statusMutation.isPending}
              onClick={() => {
                statusMutation.mutate({
                  agentId: statusDialogTarget.id,
                  isActive: statusDialogTarget.isActive === false,
                  reason: statusReason,
                });
              }}
            >
              {statusMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              {statusDialogTarget?.isActive !== false ? "Suspend Account" : "Activate Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={!!deleteDialogTarget} onOpenChange={(open) => !open && setDeleteDialogTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transport Agent</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to permanently delete agent{" "}
              <span className="font-semibold text-foreground">
                {deleteDialogTarget?.user?.name || deleteDialogTarget?.user?.phone}
              </span>
              ? This action cannot be undone. Agents with active or accepted quotes cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteDialogTarget.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BULK DELETE CONFIRM DIALOG */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Delete Transport Agents</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete <span className="font-semibold">{selectedIds.size}</span> selected agent(s)?
              Any agent with active quotes or unfulfilled loads will be skipped safely.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={bulkDeleteMutation.isPending}
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
            >
              {bulkDeleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Confirm Bulk Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DOCUMENT LIGHTBOX PREVIEW MODAL */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
          <DialogContent className="max-w-4xl p-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center justify-between">
                <span>{previewDoc.title}</span>
              </DialogTitle>
              <DialogDescription className="text-xs truncate font-mono">
                {previewDoc.url}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 rounded-xl overflow-hidden bg-black/5 dark:bg-black/50 border border-border flex items-center justify-center max-h-[75vh]">
              {previewDoc.isPdf ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.title}
                  className="w-full h-[70vh] border-0"
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                />
              )}
            </div>

            <div className="flex items-center justify-between mt-3 text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(previewDoc.url, "Document URL")}
                className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Document URL
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs gap-1.5 cursor-pointer"
                >
                  <a href={previewDoc.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
                  </a>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPreviewDoc(null)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
