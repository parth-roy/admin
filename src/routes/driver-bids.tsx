import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import {
  Gavel,
  Download,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
  MapPin,
  Truck,
  ArrowRight,
  Star,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Calendar,
  Layers,
  IndianRupee,
  Building2,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDriverBids } from "@/hooks/useDriverBids";
import { driverBidsApi } from "@/lib/api/driver-bids.api";
import { useDebounce } from "@/hooks/useDebounce";
import type { DriverBidListItem } from "@/lib/api/types";
import { toast } from "sonner";

export const Route = createFileRoute("/driver-bids")({
  head: () => ({ meta: [{ title: "Driver Bids — SUPER ADMIN" }] }),
  component: DriverBidsPage,
});

function DriverBidsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [vehicleType, setVehicleType] = useState<string>("all-vt");
  const [openBidsOnly, setOpenBidsOnly] = useState(false);
  const [selectedBid, setSelectedBid] = useState<DriverBidListItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching, refetch } = useDriverBids({
    page,
    limit: 25,
    search: debouncedSearch || undefined,
    status: openBidsOnly ? "OPEN" : status !== "all" ? status : undefined,
    vehicleType: vehicleType !== "all-vt" ? vehicleType : undefined,
  });

  const bids = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const stats = data?.stats;

  const from = total === 0 ? 0 : (page - 1) * 25 + 1;
  const to = Math.min(page * 25, total);

  const handleExport = useCallback(() => {
    const url = driverBidsApi.exportCsv();
    window.open(url, "_blank");
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`${label} copied`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fmtRupees = (amt?: number | null) => {
    if (amt == null || isNaN(amt)) return "₹0";
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setVehicleType("all-vt");
    setOpenBidsOnly(false);
    setPage(1);
  };

  const hasActiveFilters = search || status !== "all" || vehicleType !== "all-vt" || openBidsOnly;

  return (
    <div>
      <PageHeader
        title="Driver Bids Management"
        description={
          total
            ? `${total.toLocaleString("en-IN")} driver quotes across private marketplace loads`
            : "Review and manage all driver quotations on marketplace loads"
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-6">
        {/* ── 1. KPI Statistics Overview Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card/60 border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Bids
              </span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Gavel className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">
              {stats?.total ?? total ?? 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Lifetime marketplace quotes</p>
          </Card>

          <Card className="p-4 bg-card/60 border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active / Open
              </span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {stats?.open ?? 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting shipper award</p>
          </Card>

          <Card className="p-4 bg-card/60 border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Awarded Deals
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats?.awarded ?? 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Successfully assigned</p>
          </Card>

          <Card className="p-4 bg-card/60 border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Closed / Rejected
              </span>
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-muted-foreground">
              {(stats?.rejected ?? 0) + (stats?.withdrawn ?? 0) + (stats?.expired ?? 0)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Rejected or expired</p>
          </Card>
        </div>

        {/* ── 2. Robust Filtration Bar ── */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Search by Booking #, Driver Name, Phone, or City…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                if (v !== "OPEN") setOpenBidsOnly(false);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open (Active)</SelectItem>
                <SelectItem value="AWARDED">Awarded</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={vehicleType}
              onValueChange={(v) => {
                setVehicleType(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-vt">All Vehicle Types</SelectItem>
                <SelectItem value="TATA_ACE">Tata Ace</SelectItem>
                <SelectItem value="THREE_WHEELER">3-Wheeler</SelectItem>
                <SelectItem value="MINI_TRUCK">Mini Truck</SelectItem>
                <SelectItem value="BIKE">2-Wheeler / Bike</SelectItem>
              </SelectContent>
            </Select>

            {/* Quick Open Bids Toggle Pill */}
            <button
              type="button"
              onClick={() => {
                setOpenBidsOnly((prev) => !prev);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                openBidsOnly
                  ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/50"
                  : "bg-background text-muted-foreground border-border hover:bg-muted/50"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Open Bids Only
            </button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Reset filters
              </Button>
            )}
          </div>
        </Card>

        {/* ── 3. Management Table ── */}
        <Card className="overflow-hidden border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[140px]">Bid ID & Date</TableHead>
                <TableHead>Booking & Route</TableHead>
                <TableHead>Driver Details</TableHead>
                <TableHead>Quoted Amount</TableHead>
                <TableHead>Commitment / ETA</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : bids.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-56 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 rounded-full bg-muted">
                        <Gavel className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-semibold text-base">No driver bids found</p>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {hasActiveFilters
                          ? "No bids match the applied filter criteria. Try adjusting your search query or status filter."
                          : "When drivers submit quotation bids on marketplace loads, they will appear here in real-time."}
                      </p>
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2">
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bids.map((bid) => {
                  const rev = bid.latestRevision;
                  const quoted = rev?.quotedAmount ?? 0;
                  const custTotal = rev?.customerTotal ?? 0;
                  const estimated = bid.bookingEstimatedPrice ?? 0;
                  const diff = estimated > 0 ? quoted - estimated : 0;

                  return (
                    <TableRow key={bid.id} className="hover:bg-muted/40 transition-colors">
                      {/* Bid ID & Time */}
                      <TableCell>
                        <div className="font-mono text-xs font-semibold text-foreground flex items-center gap-1">
                          #{bid.id.slice(0, 8)}
                          <button
                            onClick={() => copyToClipboard(bid.id, "Bid ID")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {copiedId === bid.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {fmtDate(bid.submittedAt)}
                        </div>
                        {bid.revisionCount > 0 && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                            Rev #{bid.revisionCount}
                          </span>
                        )}
                      </TableCell>

                      {/* Booking & Route */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/bookings/$id"
                            params={{ id: bid.bookingId }}
                            className="font-bold text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            {bid.bookingNumber}
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </Link>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            {bid.vehicleType.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="font-medium text-foreground">{bid.pickupAddress}</span>
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1 mt-0.5">
                          <ArrowRight className="h-3 w-3 text-blue-500 shrink-0" />
                          <span>{bid.dropoffAddress}</span>
                        </div>
                      </TableCell>

                      {/* Driver Details */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground">
                            {bid.driverName}
                          </span>
                          {bid.isDocVerified && (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <a
                            href={`tel:${bid.driverPhone}`}
                            className="hover:underline flex items-center gap-1 text-primary"
                          >
                            <Phone className="h-2.5 w-2.5" />
                            {bid.driverPhone || "—"}
                          </a>
                          <span>•</span>
                          <span className="font-mono text-[11px] font-semibold">
                            {bid.vehicleReg}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star className="h-3 w-3 fill-amber-500" />
                            {bid.driverRating > 0 ? bid.driverRating.toFixed(1) : "5.0"}
                          </span>
                          <span>•</span>
                          <span>{bid.driverTotalTrips} trips</span>
                        </div>
                      </TableCell>

                      {/* Quoted Amount */}
                      <TableCell>
                        <div className="font-bold text-base text-foreground tracking-tight">
                          {fmtRupees(quoted)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Customer Total: <span className="font-semibold">{fmtRupees(custTotal)}</span>
                        </div>
                        {estimated > 0 && (
                          <div className="text-[10px] mt-0.5">
                            {diff === 0 ? (
                              <span className="text-muted-foreground">Matches estimate</span>
                            ) : diff > 0 ? (
                              <span className="text-amber-600 font-semibold">+{fmtRupees(diff)} vs est</span>
                            ) : (
                              <span className="text-emerald-600 font-semibold">
                                -{fmtRupees(Math.abs(diff))} vs est
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Commitment & ETA */}
                      <TableCell>
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {fmtDate(rev?.pickupCommitmentAt)}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {rev?.transitMinutes
                            ? `${Math.floor(rev.transitMinutes / 60)}h ${rev.transitMinutes % 60}m transit`
                            : "Standard transit"}
                        </div>
                        {rev?.note && (
                          <div className="text-[10px] text-muted-foreground italic truncate max-w-[140px] mt-0.5">
                            "{rev.note}"
                          </div>
                        )}
                      </TableCell>

                      {/* Bid Status */}
                      <TableCell className="text-center">
                        <StatusBadge status={bid.status} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBid(bid)}
                          className="gap-1 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
              <div>
                Showing <span className="font-semibold text-foreground">{from}</span> to{" "}
                <span className="font-semibold text-foreground">{to}</span> of{" "}
                <span className="font-semibold text-foreground">{total}</span> bids
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── 4. Comprehensive Bid Detail Drawer / Modal ── */}
      <Sheet open={!!selectedBid} onOpenChange={(open) => !open && setSelectedBid(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedBid && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg font-bold flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-primary" />
                    Driver Bid Details
                  </SheetTitle>
                  <StatusBadge status={selectedBid.status} />
                </div>
                <p className="text-xs text-muted-foreground font-mono">ID: {selectedBid.id}</p>
              </SheetHeader>

              {/* Quotation Financial Summary */}
              <Card className="p-4 bg-muted/40 border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Financial Quotation
                </span>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Driver Net Quoted</span>
                    <div className="text-2xl font-bold text-foreground">
                      {fmtRupees(selectedBid.latestRevision?.quotedAmount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Customer Total (with GST)</span>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {fmtRupees(selectedBid.latestRevision?.customerTotal)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t text-xs flex justify-between text-muted-foreground">
                  <span>GST Breakdown: {fmtRupees(selectedBid.latestRevision?.gstAmount)}</span>
                  <span>
                    Booking Est. Price: {fmtRupees(selectedBid.bookingEstimatedPrice)}
                  </span>
                </div>
              </Card>

              {/* Driver Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Driver Partner Info
                </h4>
                <Card className="p-4 space-y-2 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-base text-foreground">
                        {selectedBid.driverName}
                      </div>
                      {selectedBid.isDocVerified && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          KYC Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <Star className="h-3.5 w-3.5 fill-amber-500" />
                      {selectedBid.driverRating > 0 ? selectedBid.driverRating.toFixed(1) : "5.0"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                    <div>
                      Phone:{" "}
                      <a href={`tel:${selectedBid.driverPhone}`} className="text-primary font-medium">
                        {selectedBid.driverPhone}
                      </a>
                    </div>
                    <div>Vehicle Reg: <span className="font-mono font-semibold text-foreground">{selectedBid.vehicleReg}</span></div>
                    <div>Vehicle Type: <span className="font-medium text-foreground">{selectedBid.vehicleType}</span></div>
                    <div>Completed Trips: <span className="font-medium text-foreground">{selectedBid.driverTotalTrips}</span></div>
                  </div>
                </Card>
              </div>

              {/* Load & Route Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Associated Load & Customer
                </h4>
                <Card className="p-4 space-y-3 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">Booking Number</span>
                      <div className="font-bold text-sm text-foreground">
                        {selectedBid.bookingNumber}
                      </div>
                    </div>
                    <Link
                      to="/bookings/$id"
                      params={{ id: selectedBid.bookingId }}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      View Booking
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="text-xs space-y-2 pt-1 border-t">
                    <div>
                      <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-500" /> Pickup Location:
                      </span>
                      <p className="mt-0.5 text-foreground pl-4">{selectedBid.pickupAddress}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        <ArrowRight className="h-3 w-3 text-blue-500" /> Destination:
                      </span>
                      <p className="mt-0.5 text-foreground pl-4">{selectedBid.dropoffAddress}</p>
                    </div>
                  </div>

                  <div className="text-xs pt-2 border-t flex justify-between text-muted-foreground">
                    <span>Customer: <strong className="text-foreground">{selectedBid.customerName}</strong></span>
                    <span>Phone: <a href={`tel:${selectedBid.customerPhone}`} className="text-primary">{selectedBid.customerPhone}</a></span>
                  </div>
                </Card>
              </div>

              {/* Commitments & Driver Notes */}
              {selectedBid.latestRevision && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Driver Commitments & Notes
                  </h4>
                  <Card className="p-4 space-y-2 text-xs border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Committed Pickup Time:</span>
                      <span className="font-semibold text-foreground">
                        {fmtDate(selectedBid.latestRevision.pickupCommitmentAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transit Duration:</span>
                      <span className="font-semibold text-foreground">
                        {selectedBid.latestRevision.transitMinutes} minutes
                      </span>
                    </div>
                    {selectedBid.latestRevision.note && (
                      <div className="pt-2 border-t">
                        <span className="text-muted-foreground block mb-1">Driver's Note:</span>
                        <p className="p-2.5 rounded bg-muted/50 text-foreground italic">
                          "{selectedBid.latestRevision.note}"
                        </p>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Direct Booking Link CTA */}
              <div className="pt-4 flex gap-3">
                <Button
                  className="w-full gap-2"
                  asChild
                >
                  <Link to="/bookings/$id" params={{ id: selectedBid.bookingId }}>
                    Open Full Booking Management
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
