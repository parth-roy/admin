import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, Loader2, Star,
  Ban, CheckCircle, Trash2, ArrowDownUp, X, Filter,
  Truck, ShieldCheck, ShieldAlert, Copy, RefreshCw,
  MapPin, Building2, Phone, CheckCircle2, AlertCircle,
  ExternalLink, Sparkles, ArrowUpDown, Clock, Eye
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useDrivers, useDriverStats, useBlockDriver, useOverrideDriverStatus,
  useSoftDeleteDriver, useHardDeleteDriver, useBulkHardDeleteDrivers,
} from "@/hooks/useDrivers";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { BulkDeleteConfirmDialog } from "@/components/admin/BulkDeleteConfirmDialog";
import { DriverDetailModal } from "@/components/admin/DriverDetailModal";
import { Checkbox } from "@/components/ui/checkbox";
import { useDebounce } from "@/hooks/useDebounce";
import type { DriverStatus, UlipVerifStatus, DriverListItem } from "@/lib/api/types";
import { toast } from "sonner";

export const Route = createFileRoute("/drivers")({
  head: () => ({ meta: [{ title: "Onboarded Drivers Directory — SUPER ADMIN" }] }),
  component: DriversPage,
});

const POPULAR_STATES = [
  { code: "KL", label: "Kerala (KL)" },
  { code: "KA", label: "Karnataka (KA)" },
  { code: "TN", label: "Tamil Nadu (TN)" },
  { code: "MH", label: "Maharashtra (MH)" },
  { code: "AP", label: "Andhra Pradesh (AP)" },
  { code: "TS", label: "Telangana (TS)" },
  { code: "DL", label: "Delhi NCR (DL)" },
  { code: "WB", label: "West Bengal (WB)" },
  { code: "HR", label: "Haryana (HR)" },
  { code: "UP", label: "Uttar Pradesh (UP)" },
  { code: "GJ", label: "Gujarat (GJ)" },
  { code: "RJ", label: "Rajasthan (RJ)" },
  { code: "PB", label: "Punjab (PB)" },
];

const POPULAR_VEHICLE_TYPES = [
  { value: "TATA_ACE", label: "Tata Ace / Chhota Hathi" },
  { value: "BOLERO_PICKUP", label: "Bolero Pickup" },
  { value: "MINI_TRUCK", label: "Mini Truck (LCV)" },
  { value: "ASHOK_LEYLAND_DOST", label: "Ashok Leyland Dost" },
  { value: "MAHINDRA_JEETO", label: "Mahindra Jeeto" },
  { value: "TATA_INTRA", label: "Tata Intra" },
  { value: "TRUCK_14FT", label: "14ft Truck (Tata 407)" },
  { value: "TRUCK_17FT", label: "17ft Truck" },
  { value: "TRUCK_19FT", label: "19ft Truck" },
  { value: "TRUCK_20FT", label: "20ft Truck" },
  { value: "CONTAINER_32FT", label: "32ft Container" },
  { value: "TRAILER_40FT_FLATBED", label: "40ft Flatbed Trailer" },
  { value: "THREE_WHEELER", label: "Three Wheeler (Auto/Piaggio)" },
  { value: "BIKE", label: "Two Wheeler / Bike" },
];

const STATE_NAMES: Record<string, string> = {
  KL: "Kerala",
  KA: "Karnataka",
  TN: "Tamil Nadu",
  MH: "Maharashtra",
  AP: "Andhra Pradesh",
  TS: "Telangana",
  DL: "Delhi NCR",
  HR: "Haryana",
  UP: "Uttar Pradesh",
  GJ: "Gujarat",
  RJ: "Rajasthan",
  WB: "West Bengal",
  PB: "Punjab",
  MP: "Madhya Pradesh",
  BR: "Bihar",
  OD: "Odisha",
};

function getRtoInfo(regNo?: string | null): { rto: string; state: string } | null {
  if (!regNo) return null;
  const clean = regNo.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (clean.length < 2) return null;
  const stateCode = clean.slice(0, 2);
  const rto = clean.length >= 4 ? `${clean.slice(0, 2)} ${clean.slice(2, 4)}` : stateCode;
  return {
    rto,
    state: STATE_NAMES[stateCode] || stateCode,
  };
}

function formatVehicleType(type?: string | null): string {
  if (!type) return "—";
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function DriversPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [vehicleType, setVehicleType] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [dlVerif, setDlVerif] = useState("all");
  const [rcVerif, setRcVerif] = useState("all");
  const [docVerif, setDocVerif] = useState("all");
  const [accountStatus, setAccountStatus] = useState("all"); // 'all' | 'ACTIVE' | 'BLOCKED'
  const [tripsFilter, setTripsFilter] = useState("all"); // 'all' | 'HAS_TRIPS' | 'ZERO_TRIPS'
  const [sortBy, setSortBy] = useState("createdAt_desc");

  // Selected Driver for Details Dossier Modal
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DriverListItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  // Fetch KPI Stats for Onboarded Drivers Only
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useDriverStats();

  // Fetch Drivers with full filters
  const { data, isLoading, isFetching, refetch } = useDrivers({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: status !== "all" ? (status as DriverStatus) : undefined,
    vehicleType: vehicleType !== "all" ? vehicleType : undefined,
    state: stateFilter !== "all" ? stateFilter : undefined,
    dlVerifStatus: dlVerif !== "all" ? (dlVerif as UlipVerifStatus) : undefined,
    rcVerifStatus: rcVerif !== "all" ? (rcVerif as UlipVerifStatus) : undefined,
    accountStatus: accountStatus !== "all" ? (accountStatus as any) : undefined,
    tripsFilter: tripsFilter !== "all" ? (tripsFilter as any) : undefined,
    sortBy: sortBy !== "createdAt_desc" ? sortBy : undefined,
    isDocVerified: docVerif === "verified" ? true : docVerif === "unverified" ? false : undefined,
  });

  const blockMut = useBlockDriver();
  const overrideStatusMut = useOverrideDriverStatus();
  const softDeleteMut = useSoftDeleteDriver();
  const hardDeleteMut = useHardDeleteDriver();
  const bulkHardDeleteMut = useBulkHardDeleteDrivers();

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const pageIds = data?.data?.map((d: DriverListItem) => d.id) ?? [];
  const isAllPageSelected = pageIds.length > 0 && pageIds.every((id: string) => selectedIds.has(id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const next = new Set(selectedIds);
      pageIds.forEach((id: string) => next.delete(id));
      setSelectedIds(next);
      setSelectAllFiltered(false);
    } else {
      const next = new Set(selectedIds);
      pageIds.forEach((id: string) => next.add(id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
      setSelectAllFiltered(false);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setVehicleType("all");
    setStateFilter("all");
    setDlVerif("all");
    setRcVerif("all");
    setDocVerif("all");
    setAccountStatus("all");
    setTripsFilter("all");
    setSortBy("createdAt_desc");
    setPage(1);
    setSelectedIds(new Set());
    setSelectAllFiltered(false);
  };

  const hasFilters =
    Boolean(search) ||
    status !== "all" ||
    vehicleType !== "all" ||
    stateFilter !== "all" ||
    dlVerif !== "all" ||
    rcVerif !== "all" ||
    docVerif !== "all" ||
    accountStatus !== "all" ||
    tripsFilter !== "all" ||
    sortBy !== "createdAt_desc";

  const handleConfirmBulkDelete = async (reason: string) => {
    try {
      const payload: any = { reason };
      if (selectAllFiltered) {
        payload.selectAllFiltered = true;
        payload.filter = {
          status: status !== "all" ? status : undefined,
          vehicleType: vehicleType !== "all" ? vehicleType : undefined,
          state: stateFilter !== "all" ? stateFilter : undefined,
          dlVerifStatus: dlVerif !== "all" ? dlVerif : undefined,
          rcVerifStatus: rcVerif !== "all" ? rcVerif : undefined,
          accountStatus: accountStatus !== "all" ? accountStatus : undefined,
          tripsFilter: tripsFilter !== "all" ? tripsFilter : undefined,
          isDocVerified: docVerif === "verified" ? true : docVerif === "unverified" ? false : undefined,
          search: debouncedSearch || undefined,
        };
      } else {
        payload.ids = Array.from(selectedIds);
      }

      const res = await bulkHardDeleteMut.mutateAsync(payload);
      toast.success(`Successfully permanently deleted ${res.deletedCount} driver(s).`);
      if (res.skippedCount > 0) {
        toast.warning(`Skipped ${res.skippedCount} driver(s) due to active bookings.`);
      }
      setSelectedIds(new Set());
      setSelectAllFiltered(false);
      setIsBulkDeleteOpen(false);
      refetch();
      refetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to bulk delete drivers");
    }
  };

  return (
    <div>
      <PageHeader
        title="Drivers Directory"
        description="Comprehensive fleet directory of verified & onboarded commercial drivers, vehicle assignments, and real-time status."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={() => {
                refetch();
                refetchStats();
                toast.info("Refreshed driver directory");
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button asChild size="sm" className="h-9 text-xs font-semibold shadow-xs">
              <Link to="/verification">
                <ShieldCheck className="h-4 w-4 mr-1.5" /> Verification Queue
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-6">
        {/* ── KPI Summary Cards (Onboarded Fleet Only) ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card
            onClick={resetFilters}
            className={`p-3 cursor-pointer transition-all hover:border-primary/50 shadow-xs ${
              !hasFilters ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Total Onboarded</span>
              <Truck className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="mt-1.5 text-xl font-bold tracking-tight">
              {stats?.totalDrivers != null ? stats.totalDrivers.toLocaleString("en-IN") : isStatsLoading ? "—" : total.toLocaleString("en-IN")}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{stats?.docsVerified ?? 0} Verified</span>
              <span className="text-primary font-semibold">View All</span>
            </div>
          </Card>

          <Card
            onClick={() => {
              resetFilters();
              setStatus("AVAILABLE");
              setAccountStatus("ACTIVE");
            }}
            className={`p-3 cursor-pointer transition-all hover:border-emerald-500/50 shadow-xs ${
              status === "AVAILABLE" ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20" : "bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Available Now</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="mt-1.5 text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats?.available != null ? stats.available.toLocaleString("en-IN") : "—"}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Ready for Dispatch</div>
          </Card>

          <Card
            onClick={() => {
              resetFilters();
              setStatus("ON_TRIP");
            }}
            className={`p-3 cursor-pointer transition-all hover:border-blue-500/50 shadow-xs ${
              status === "ON_TRIP" ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20" : "bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>On Trip</span>
              <Clock className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div className="mt-1.5 text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {stats?.onTrip != null ? stats.onTrip.toLocaleString("en-IN") : "—"}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">En Route / Transit</div>
          </Card>

          <Card
            onClick={() => {
              resetFilters();
              setDocVerif("unverified");
            }}
            className={`p-3 cursor-pointer transition-all hover:border-amber-500/50 shadow-xs ${
              docVerif === "unverified" ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/20" : "bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Docs Pending</span>
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="mt-1.5 text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {stats?.docsPending != null ? stats.docsPending.toLocaleString("en-IN") : "—"}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">KYC Review Needed</div>
          </Card>

          <Card
            onClick={() => {
              resetFilters();
              setDocVerif("verified");
            }}
            className={`p-3 cursor-pointer transition-all hover:border-emerald-500/50 shadow-xs ${
              docVerif === "verified" ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20" : "bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Fully Verified</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="mt-1.5 text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
              {stats?.docsVerified != null ? stats.docsVerified.toLocaleString("en-IN") : "—"}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">ULIP / KYC Approved</div>
          </Card>

          <Card
            onClick={() => {
              resetFilters();
              setAccountStatus("BLOCKED");
            }}
            className={`p-3 cursor-pointer transition-all hover:border-red-500/50 shadow-xs ${
              accountStatus === "BLOCKED" ? "border-red-500 bg-red-500/5 ring-1 ring-red-500/20" : "bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Blocked / Inactive</span>
              <Ban className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div className="mt-1.5 text-xl font-bold tracking-tight text-destructive">
              {stats?.blocked != null ? stats.blocked.toLocaleString("en-IN") : "—"}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Suspended Accounts</div>
          </Card>
        </div>

        {/* ── Multi-Facet Filter Console ── */}
        <Card className="p-4 space-y-3 shadow-xs border">
          {/* Row 1: Search & Primary Filters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="relative md:col-span-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9 pr-8 h-9 text-xs"
                placeholder="Search onboarded driver name, phone, DL, or vehicle no (e.g. KL14, PB10, MH12)…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Operational Status */}
            <div className="md:col-span-3">
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Operational Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Op. Statuses</SelectItem>
                  <SelectItem value="AVAILABLE">🟢 Available</SelectItem>
                  <SelectItem value="ON_TRIP">🟡 On Trip</SelectItem>
                  <SelectItem value="OFFLINE">⚪ Offline</SelectItem>
                  <SelectItem value="BREAK">⏸️ On Break</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Type */}
            <div className="md:col-span-3">
              <Select
                value={vehicleType}
                onValueChange={(v) => {
                  setVehicleType(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Vehicle Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicle Types</SelectItem>
                  {POPULAR_VEHICLE_TYPES.map((vt) => (
                    <SelectItem key={vt.value} value={vt.value}>
                      {vt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Secondary Facets: Region, DL, RC, Docs, Account, Trips, Sorting */}
          <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-7 gap-2.5 pt-2 border-t text-xs">
            {/* State / Region (RTO) */}
            <div>
              <Select
                value={stateFilter}
                onValueChange={(v) => {
                  setStateFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States / RTO</SelectItem>
                  {POPULAR_STATES.map((st) => (
                    <SelectItem key={st.code} value={st.code}>
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DL SARATHI Status */}
            <div>
              <Select
                value={dlVerif}
                onValueChange={(v) => {
                  setDlVerif(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All DL Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All DL Statuses</SelectItem>
                  <SelectItem value="VERIFIED">DL Verified</SelectItem>
                  <SelectItem value="PENDING">DL Pending</SelectItem>
                  <SelectItem value="FAILED">DL Failed</SelectItem>
                  <SelectItem value="MANUAL_REVIEW">DL Manual Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* RC VAHAN Status */}
            <div>
              <Select
                value={rcVerif}
                onValueChange={(v) => {
                  setRcVerif(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All RC Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All RC Statuses</SelectItem>
                  <SelectItem value="VERIFIED">RC Verified</SelectItem>
                  <SelectItem value="PENDING">RC Pending</SelectItem>
                  <SelectItem value="FAILED">RC Failed</SelectItem>
                  <SelectItem value="MANUAL_REVIEW">RC Manual Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Overall Docs Approval */}
            <div>
              <Select
                value={docVerif}
                onValueChange={(v) => {
                  setDocVerif(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Docs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Docs Approval</SelectItem>
                  <SelectItem value="verified">Docs Verified</SelectItem>
                  <SelectItem value="unverified">Docs Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Status */}
            <div>
              <Select
                value={accountStatus}
                onValueChange={(v) => {
                  setAccountStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="ACTIVE">Active Accounts</SelectItem>
                  <SelectItem value="BLOCKED">Blocked Accounts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trips Activity */}
            <div>
              <Select
                value={tripsFilter}
                onValueChange={(v) => {
                  setTripsFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Trip Activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trip Activity</SelectItem>
                  <SelectItem value="HAS_TRIPS">Completed Trips (&gt;0)</SelectItem>
                  <SelectItem value="ZERO_TRIPS">Zero Trips (New)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="col-span-2 md:col-span-1">
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  setSortBy(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt_desc">Newest Registered</SelectItem>
                  <SelectItem value="createdAt_asc">Oldest Registered</SelectItem>
                  <SelectItem value="rating_desc">Highest Rating (5★)</SelectItem>
                  <SelectItem value="trips_desc">Most Completed Trips</SelectItem>
                  <SelectItem value="name_asc">Driver Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filter Chips & Clear */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t text-xs">
              <span className="text-muted-foreground font-medium mr-1 flex items-center gap-1 text-[11px]">
                <Filter className="h-3 w-3 text-primary" /> Active Filters:
              </span>

              {debouncedSearch && (
                <Badge variant="secondary" className="gap-1 h-6 font-normal">
                  Search: &ldquo;{debouncedSearch}&rdquo;
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setSearch("")} />
                </Badge>
              )}

              {status !== "all" && (
                <Badge variant="secondary" className="gap-1 h-6 font-normal">
                  Status: {status}
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setStatus("all")} />
                </Badge>
              )}

              {vehicleType !== "all" && (
                <Badge variant="secondary" className="gap-1 h-6 font-normal">
                  Vehicle: {formatVehicleType(vehicleType)}
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setVehicleType("all")} />
                </Badge>
              )}

              {stateFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 h-6 font-normal">
                  Region: {STATE_NAMES[stateFilter] || stateFilter}
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setStateFilter("all")} />
                </Badge>
              )}

              {docVerif !== "all" && (
                <Badge variant="secondary" className="gap-1 h-6 font-normal">
                  Docs: {docVerif === "verified" ? "Verified" : "Pending"}
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setDocVerif("all")} />
                </Badge>
              )}

              {dlVerif !== "all" && (
                <Badge variant="secondary" className="gap-1 h-6 font-normal">
                  DL: {dlVerif}
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setDlVerif("all")} />
                </Badge>
              )}

              {rcVerif !== "all" && (
                <Badge variant="secondary" className="gap-1 h-6 font-normal">
                  RC: {rcVerif}
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setRcVerif("all")} />
                </Badge>
              )}

              {accountStatus !== "all" && (
                <Badge variant="secondary" className="gap-1 h-6 font-normal">
                  Account: {accountStatus}
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setAccountStatus("all")} />
                </Badge>
              )}

              {tripsFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 h-6 font-normal">
                  Trips: {tripsFilter === "HAS_TRIPS" ? "Completed (>0)" : "Zero Trips"}
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setTripsFilter("all")} />
                </Badge>
              )}

              {sortBy !== "createdAt_desc" && (
                <Badge variant="secondary" className="gap-1 h-6 font-normal">
                  Sort: {sortBy}
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setSortBy("createdAt_desc")} />
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10"
              >
                Reset All Filters
              </Button>

              <span className="ml-auto text-[11px] text-muted-foreground font-medium">
                Showing <strong>{total.toLocaleString("en-IN")}</strong> onboarded drivers
              </span>
            </div>
          )}
        </Card>

        {/* ── Table Container ── */}
        <Card className="shadow-xs border overflow-hidden">
          {/* Bulk Selection Bar */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-red-50/90 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 text-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="font-bold">
                  {selectAllFiltered
                    ? `All ${total.toLocaleString("en-IN")} filtered drivers selected`
                    : `${selectedIds.size} driver${selectedIds.size > 1 ? "s" : ""} selected on this page`}
                </span>
                {total > (data?.data?.length ?? 0) && !selectAllFiltered && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs font-semibold text-red-700 underline dark:text-red-400"
                    onClick={() => setSelectAllFiltered(true)}
                  >
                    Select all {total.toLocaleString("en-IN")} drivers matching filter
                  </Button>
                )}
                {selectAllFiltered && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs font-semibold text-red-700 underline dark:text-red-400"
                    onClick={() => setSelectAllFiltered(false)}
                  >
                    Limit to page selection only ({selectedIds.size})
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => {
                    setSelectedIds(new Set());
                    setSelectAllFiltered(false);
                  }}
                >
                  Deselect All
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs gap-1.5 font-bold"
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Bulk Delete ({selectAllFiltered ? total.toLocaleString("en-IN") : selectedIds.size})
                </Button>
              </div>
            </div>
          )}

          <div className="relative overflow-x-auto">
            {isFetching && !isLoading && (
              <div className="absolute right-4 top-3 z-10 flex items-center gap-1.5 bg-background/90 backdrop-blur px-2 py-1 rounded border text-xs text-muted-foreground shadow-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Updating results…
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={isAllPageSelected}
                      onCheckedChange={toggleSelectAllPage}
                      aria-label="Select all on this page"
                    />
                  </TableHead>
                  <TableHead className="min-w-[190px]">Driver Profile</TableHead>
                  <TableHead className="min-w-[140px]">Contact</TableHead>
                  <TableHead className="min-w-[130px]">Region / RTO</TableHead>
                  <TableHead className="min-w-[180px]">Vehicle & RC</TableHead>
                  <TableHead className="min-w-[140px]">License (DL)</TableHead>
                  <TableHead className="min-w-[130px]">Op. Status</TableHead>
                  <TableHead className="min-w-[130px]">Docs KYC</TableHead>
                  <TableHead className="min-w-[90px]">Account</TableHead>
                  <TableHead className="min-w-[110px]">Trips & Rating</TableHead>
                  <TableHead className="min-w-[110px]">Registered</TableHead>
                  <TableHead className="text-right min-w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 12 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((d: DriverListItem) => {
                    const rtoInfo = getRtoInfo(d.vehicle?.registrationNo);
                    const driverName = d.user?.name || "Driver Partner";
                    const cleanPhone = (d.user?.phone || "").replace(/\D/g, "").slice(-10);

                    return (
                      <TableRow key={d.id} className="hover:bg-muted/40 transition-colors">
                        {/* Checkbox */}
                        <TableCell className="pl-4">
                          <Checkbox
                            checked={selectedIds.has(d.id)}
                            onCheckedChange={() => toggleSelectOne(d.id)}
                            aria-label={`Select ${driverName}`}
                          />
                        </TableCell>

                        {/* Driver Profile (Click opens full driver details dossier) */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedDriverId(d.id)}
                                className="font-semibold text-sm hover:underline hover:text-primary text-foreground text-left tracking-tight cursor-pointer"
                              >
                                {driverName}
                              </button>
                              <Badge variant="outline" className="text-[10px] h-4 px-1 border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 font-medium">
                                Onboarded
                              </Badge>
                            </div>

                            {/* Fleet Owner tag if attached */}
                            {d.fleetOwner && (
                              <div className="flex items-center gap-1 text-[11px] text-blue-700 dark:text-blue-300">
                                <Building2 className="h-3 w-3" />
                                <span className="font-medium truncate max-w-[130px]">{d.fleetOwner.companyName}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Phone / Contact */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono text-foreground font-medium">
                              {d.user?.phone || "—"}
                            </span>
                            {d.user?.phone && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  navigator.clipboard.writeText(d.user.phone);
                                  toast.success("Phone number copied");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {cleanPhone && (
                            <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                              <a
                                href={`tel:${cleanPhone}`}
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                Call
                              </a>
                              <span className="text-muted-foreground/40">•</span>
                              <a
                                href={`https://wa.me/91${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:underline"
                              >
                                WhatsApp
                              </a>
                            </div>
                          )}
                        </TableCell>

                        {/* Region / RTO */}
                        <TableCell>
                          {rtoInfo ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="font-mono text-[11px] font-bold tracking-wider bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                                {rtoInfo.rto}
                              </Badge>
                              <div className="text-[11px] text-muted-foreground font-medium truncate max-w-[120px]">
                                {rtoInfo.state}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Vehicle & RC */}
                        <TableCell>
                          {d.vehicle?.registrationNo ? (
                            <div className="space-y-1">
                              <div className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                                {d.vehicle.registrationNo}
                              </div>
                              <div className="flex flex-wrap items-center gap-1">
                                <Badge variant="secondary" className="text-[10px] h-4 font-normal px-1.5">
                                  {formatVehicleType(d.vehicle.type)}
                                </Badge>
                                <StatusBadge status={d.vehicle.rcVerifStatus} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No vehicle attached</span>
                          )}
                        </TableCell>

                        {/* License (DL) */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs font-mono font-semibold truncate max-w-[120px] text-foreground">
                              {d.licenseNumber || "—"}
                            </div>
                            <StatusBadge status={d.dlVerifStatus} />
                          </div>
                        </TableCell>

                        {/* Operational Status */}
                        <TableCell>
                          <Select
                            value={d.status}
                            onValueChange={async (val) => {
                              if (val === d.status) return;
                              setLoadingId(`${d.id}-status`);
                              try {
                                await overrideStatusMut.mutateAsync({ id: d.id, status: val as any });
                                toast.success(`Driver status set to ${val}`);
                                refetch();
                                refetchStats();
                              } catch {
                                toast.error("Status update failed");
                              } finally {
                                setLoadingId(null);
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 w-[115px] text-xs font-semibold shadow-2xs">
                              {loadingId === `${d.id}-status` ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <span className={`h-2 w-2 rounded-full mr-1.5 inline-block ${
                                  d.status === "AVAILABLE" ? "bg-emerald-500" :
                                  d.status === "ON_TRIP" ? "bg-blue-500" :
                                  d.status === "BREAK" ? "bg-amber-500" : "bg-slate-400"
                                }`} />
                              )}
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AVAILABLE">Available</SelectItem>
                              <SelectItem value="ON_TRIP">On Trip</SelectItem>
                              <SelectItem value="OFFLINE">Offline</SelectItem>
                              <SelectItem value="BREAK">On Break</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Docs KYC with dedicated button for unverified drivers */}
                        <TableCell>
                          <div className="space-y-1">
                            {d.isDocVerified ? (
                              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-[11px] font-semibold gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Verified
                              </Badge>
                            ) : (
                              <div className="space-y-1">
                                <Badge variant="outline" className="text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-[11px] font-semibold gap-1">
                                  <AlertCircle className="h-3 w-3" /> Pending
                                </Badge>
                                <div>
                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-1.5 text-[10px] gap-1 font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300 dark:border-amber-800 shadow-2xs"
                                  >
                                    <Link to="/verification">
                                      <ShieldAlert className="h-3 w-3 text-amber-600" /> Verify KYC <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            )}
                            {typeof d.complianceScore === "number" && (
                              <div className="text-[10px] text-muted-foreground">
                                Score: {d.complianceScore}%
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Account Status */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs font-semibold ${
                              d.user?.isActive
                                ? "text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
                                : "text-destructive border-destructive/40 bg-red-50 dark:bg-red-950/40"
                            }`}
                          >
                            {d.user?.isActive ? "Active" : "Blocked"}
                          </Badge>
                        </TableCell>

                        {/* Trips & Rating */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                              {Number(d.rating ?? 5.0).toFixed(1)}
                            </span>
                            <div className="text-[11px] text-muted-foreground">
                              {d.totalTrips ?? 0} {d.totalTrips === 1 ? "trip" : "trips"}
                            </div>
                          </div>
                        </TableCell>

                        {/* Registered Date */}
                        <TableCell className="text-xs text-muted-foreground">
                          {fmtDate(d.createdAt)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            {/* Inspect / View Profile Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2 gap-1 font-medium hover:bg-primary/10 hover:text-primary shadow-2xs"
                              onClick={() => setSelectedDriverId(d.id)}
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" /> View
                            </Button>

                            {/* Block/Unblock Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-7 text-xs px-2 ${
                                d.user?.isActive
                                  ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              }`}
                              disabled={loadingId === `${d.id}-block`}
                              onClick={async () => {
                                setLoadingId(`${d.id}-block`);
                                try {
                                  await blockMut.mutateAsync({ id: d.id, isActive: !d.user?.isActive });
                                  toast.success(`Driver ${d.user?.isActive ? "blocked" : "unblocked"}`);
                                  refetch();
                                  refetchStats();
                                } catch {
                                  toast.error("Action failed");
                                } finally {
                                  setLoadingId(null);
                                }
                              }}
                            >
                              {loadingId === `${d.id}-block` ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : d.user?.isActive ? (
                                <Ban className="h-3 w-3 mr-1" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              {d.user?.isActive ? "Block" : "Unblock"}
                            </Button>

                            {/* Delete Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget(d)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Truck className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-semibold text-foreground">No onboarded drivers match your current filters</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Try adjusting search terms, widening region/RTO, or clearing selected status filters.
                        </p>
                        {hasFilters && (
                          <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 text-xs">
                            <X className="h-3.5 w-3.5 mr-1" /> Clear All Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-wrap items-center justify-between border-t p-3 text-xs text-muted-foreground gap-3">
            <div className="flex items-center gap-3">
              <span>
                {total > 0
                  ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total.toLocaleString("en-IN")} drivers`
                  : "0 results"}
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span>Per page:</span>
                <Select
                  value={String(limit)}
                  onValueChange={(val) => {
                    setLimit(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-[65px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <span className="font-semibold px-1">
                {page} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Driver Detail Modal / Dossier */}
      <DriverDetailModal
        driverId={selectedDriverId}
        open={!!selectedDriverId}
        onOpenChange={(isOpen) => !isOpen && setSelectedDriverId(null)}
        onRefreshList={() => {
          refetch();
          refetchStats();
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          entityLabel="Driver"
          entityName={deleteTarget.user?.name ?? deleteTarget.user?.phone ?? deleteTarget.id}
          softDeleteLabel="Block & Deactivate Driver"
          onSoftDelete={async (reason) => {
            await softDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Driver account deactivated");
            setDeleteTarget(null);
            refetch();
            refetchStats();
          }}
          onHardDelete={async (reason) => {
            await hardDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Driver permanently deleted");
            setDeleteTarget(null);
            refetch();
            refetchStats();
          }}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        entityLabel="Drivers"
        selectedCount={selectAllFiltered ? total : selectedIds.size}
        onConfirm={handleConfirmBulkDelete}
        isLoading={bulkHardDeleteMut.isPending}
      />
    </div>
  );
}
