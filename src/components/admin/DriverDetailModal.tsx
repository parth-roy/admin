import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  User, Phone, Mail, Calendar, MapPin, Truck, ShieldCheck, ShieldAlert,
  Star, CreditCard, Building2, Copy, ExternalLink, Eye, Ban, CheckCircle,
  ArrowDownUp, Loader2, FileText, Image as ImageIcon, IndianRupee,
  X, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Car, Award
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useDriver, useBlockDriver, useOverrideDriverStatus } from "@/hooks/useDrivers";
import type { DriverDetail, DriverDocument } from "@/lib/api/types";
import { toast } from "sonner";

interface DriverDetailModalProps {
  driverId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefreshList?: () => void;
}

export function DriverDetailModal({
  driverId,
  open,
  onOpenChange,
  onRefreshList,
}: DriverDetailModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingBlock, setIsUpdatingBlock] = useState(false);

  const { data: driver, isLoading, isError, refetch } = useDriver(driverId || "");
  const blockMut = useBlockDriver();
  const overrideStatusMut = useOverrideDriverStatus();

  if (!open) return null;

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const fmtDateTime = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const cleanPhone = (driver?.user?.phone || "").replace(/\D/g, "").slice(-10);

  const handleStatusChange = async (newStatus: string) => {
    if (!driver || newStatus === driver.status) return;
    setIsUpdatingStatus(true);
    try {
      await overrideStatusMut.mutateAsync({ id: driver.id, status: newStatus as any });
      toast.success(`Operational status set to ${newStatus}`);
      refetch();
      onRefreshList?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update operational status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!driver) return;
    setIsUpdatingBlock(true);
    const newIsActive = !driver.user?.isActive;
    try {
      await blockMut.mutateAsync({ id: driver.id, isActive: newIsActive });
      toast.success(`Driver account ${newIsActive ? "unblocked" : "blocked"}`);
      refetch();
      onRefreshList?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to toggle account status");
    } finally {
      setIsUpdatingBlock(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 relative">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-48 bg-slate-800" />
                <Skeleton className="h-4 w-72 bg-slate-800" />
              </div>
            ) : driver ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary text-base">
                      {driver.user?.name ? driver.user.name.slice(0, 2).toUpperCase() : "DR"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight text-white">
                          {driver.user?.name || "Driver Partner"}
                        </h2>
                        {driver.isDocVerified ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] h-5">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Approved Driver
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] h-5">
                            <ShieldAlert className="h-3 w-3 mr-1" /> KYC Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Driver ID: <code className="text-slate-300 font-mono">{driver.id.slice(0, 8)}</code></span>
                        <span>•</span>
                        <span>Registered {fmtDate(driver.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header Action Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Dropdown */}
                  <Select value={driver.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                    <SelectTrigger className="h-8 w-[125px] text-xs font-semibold bg-slate-800 border-slate-700 text-white shadow-2xs">
                      {isUpdatingStatus ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <span className={`h-2 w-2 rounded-full mr-1.5 inline-block ${
                          driver.status === "AVAILABLE" ? "bg-emerald-400" :
                          driver.status === "ON_TRIP" ? "bg-blue-400" :
                          driver.status === "BREAK" ? "bg-amber-400" : "bg-slate-500"
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

                  {/* Block / Unblock Toggle */}
                  <Button
                    size="sm"
                    variant={driver.user?.isActive ? "destructive" : "default"}
                    className="h-8 text-xs font-semibold"
                    disabled={isUpdatingBlock}
                    onClick={handleBlockToggle}
                  >
                    {isUpdatingBlock ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : driver.user?.isActive ? (
                      <Ban className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    )}
                    {driver.user?.isActive ? "Block Account" : "Unblock Account"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Pending Verification Notice Banner */}
          {driver && !driver.isDocVerified && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 p-3 px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>KYC Verification Pending:</strong> This driver&apos;s uploaded documents and government ULIP data require approval before dispatch eligibility.
                </span>
              </div>
              <Button asChild size="sm" variant="outline" className="h-7 text-xs font-semibold bg-white hover:bg-amber-50 border-amber-300 text-amber-800 shadow-2xs">
                <Link to="/verification">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Go to Verification Desk <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          )}

          {/* Modal Body / Tabs */}
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4 py-8">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </div>
              </div>
            ) : isError || !driver ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
                <p className="font-semibold text-foreground">Driver details could not be loaded</p>
                <p className="text-xs">Record may have been modified or deleted.</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-5 w-full h-9">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="vehicle" className="text-xs">Vehicle & RC</TabsTrigger>
                  <TabsTrigger value="license" className="text-xs">License (DL)</TabsTrigger>
                  <TabsTrigger value="bank" className="text-xs">Bank & Payouts</TabsTrigger>
                  <TabsTrigger value="documents" className="text-xs">
                    KYC Docs ({driver.documents?.length ?? 0})
                  </TabsTrigger>
                </TabsList>

                {/* ── TAB 1: OVERVIEW ── */}
                <TabsContent value="overview" className="space-y-4 mt-2">
                  {/* KPI Stat Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="p-3 shadow-2xs">
                      <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                        <span>Rating</span>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      </div>
                      <div className="mt-1 text-xl font-bold tracking-tight">
                        {Number(driver.rating ?? 5.0).toFixed(1)} / 5.0
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Based on customer feedback</div>
                    </Card>

                    <Card className="p-3 shadow-2xs">
                      <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                        <span>Total Trips</span>
                        <Truck className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="mt-1 text-xl font-bold tracking-tight">
                        {driver.totalTrips ?? 0}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Completed journeys</div>
                    </Card>

                    <Card className="p-3 shadow-2xs">
                      <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                        <span>Wallet Balance</span>
                        <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <div className="mt-1 text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                        ₹{(driver.user?.wallet?.cachedBalance ?? 0).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Driver payout wallet</div>
                    </Card>

                    <Card className="p-3 shadow-2xs">
                      <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                        <span>Compliance Score</span>
                        <Award className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <div className="mt-1 text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                        {driver.complianceScore ?? 0}%
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">KYC & Document health</div>
                    </Card>
                  </div>

                  {/* Personal & Account Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 shadow-2xs border">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> Personal Information
                      </h4>
                      <dl className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b">
                          <dt className="text-muted-foreground">Full Name</dt>
                          <dd className="font-semibold text-foreground">{driver.user?.name || "—"}</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <dt className="text-muted-foreground">Mobile Phone</dt>
                          <dd className="font-semibold font-mono text-foreground flex items-center gap-1.5">
                            {driver.user?.phone}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(driver.user.phone);
                                toast.success("Phone copied");
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </dd>
                        </div>
                        {cleanPhone && (
                          <div className="flex justify-between py-1 border-b">
                            <dt className="text-muted-foreground">Contact Actions</dt>
                            <dd className="flex items-center gap-2">
                              <a href={`tel:${cleanPhone}`} className="text-primary hover:underline font-semibold">
                                Call Driver
                              </a>
                              <span>•</span>
                              <a
                                href={`https://wa.me/91${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:underline font-semibold"
                              >
                                WhatsApp
                              </a>
                            </dd>
                          </div>
                        )}
                        <div className="flex justify-between py-1 border-b">
                          <dt className="text-muted-foreground">Email Address</dt>
                          <dd className="text-foreground">{driver.user?.email || "—"}</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <dt className="text-muted-foreground">Registered Date</dt>
                          <dd className="text-foreground">{fmtDateTime(driver.createdAt)}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-muted-foreground">Account Status</dt>
                          <dd>
                            <Badge variant="outline" className={driver.user?.isActive ? "text-emerald-700 border-emerald-300" : "text-destructive border-destructive"}>
                              {driver.user?.isActive ? "Active Account" : "Blocked / Deactivated"}
                            </Badge>
                          </dd>
                        </div>
                      </dl>
                    </Card>

                    <Card className="p-4 shadow-2xs border">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" /> Fleet & Membership Status
                      </h4>
                      {driver.fleetOwner ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md text-xs space-y-1">
                            <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-blue-600" />
                              {driver.fleetOwner.companyName}
                            </div>
                            <p className="text-muted-foreground">
                              Fleet Owner: <strong>{driver.fleetOwner.user?.name || "Partner"}</strong> ({driver.fleetOwner.user?.phone || "—"})
                            </p>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            This driver is actively assigned to an enterprise fleet. Trip dispatches and settlements are co-routed via their fleet owner wallet.
                          </p>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground space-y-1">
                          <Truck className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                          <p className="font-semibold text-xs text-foreground">Independent Direct Driver</p>
                          <p className="text-[11px] text-muted-foreground">
                            Operating independently on the GoMyTruck direct marketplace.
                          </p>
                        </div>
                      )}
                    </Card>
                  </div>
                </TabsContent>

                {/* ── TAB 2: VEHICLE & RC ── */}
                <TabsContent value="vehicle" className="space-y-4 mt-2">
                  {driver.vehicle ? (
                    <Card className="p-4 shadow-2xs border space-y-4">
                      <div className="flex flex-wrap items-center justify-between pb-3 border-b gap-2">
                        <div>
                          <div className="text-lg font-bold font-mono tracking-wider uppercase text-foreground">
                            {driver.vehicle.registrationNo}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {driver.vehicle.make ? `${driver.vehicle.make} • ` : ""}{driver.vehicle.model || "Commercial Vehicle"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {driver.vehicle.type?.replace(/_/g, " ")}
                          </Badge>
                          <StatusBadge status={driver.vehicle.rcVerifStatus} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">Owner Name (VAHAN)</span>
                          <span className="font-semibold text-foreground">{driver.vehicle.ownerName || "—"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">Vehicle Type Category</span>
                          <span className="font-semibold text-foreground">{driver.vehicle.type}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">Chassis Number</span>
                          <span className="font-mono text-foreground">{driver.vehicle.chassisNumber || "—"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">Engine Number</span>
                          <span className="font-mono text-foreground">{driver.vehicle.engineNumber || "—"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">Manufacturing Year</span>
                          <span className="text-foreground">{driver.vehicle.year || "—"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">Payload Capacity (KG)</span>
                          <span className="font-semibold text-foreground">{driver.vehicle.capacityKg ? `${driver.vehicle.capacityKg.toLocaleString("en-IN")} kg` : "—"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">Color</span>
                          <span className="text-foreground">{driver.vehicle.color || "—"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">RC Verified At</span>
                          <span className="text-foreground">{fmtDateTime(driver.vehicle.rcVerifiedAt)}</span>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground space-y-2 border rounded-lg bg-muted/10">
                      <Car className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                      <p className="font-semibold text-sm text-foreground">No vehicle registered</p>
                      <p className="text-xs text-muted-foreground">This driver has not attached a commercial truck or mini-truck yet.</p>
                    </div>
                  )}
                </TabsContent>

                {/* ── TAB 3: LICENSE & ULIP ── */}
                <TabsContent value="license" className="space-y-4 mt-2">
                  <Card className="p-4 shadow-2xs border space-y-4">
                    <div className="flex flex-wrap items-center justify-between pb-3 border-b gap-2">
                      <div>
                        <div className="text-lg font-bold font-mono tracking-wider uppercase text-foreground">
                          {driver.licenseNumber || driver.dlNumber || "No DL Recorded"}
                        </div>
                        <p className="text-xs text-muted-foreground">Government SARATHI Registry Record</p>
                      </div>
                      <StatusBadge status={driver.dlVerifStatus} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">License Number</span>
                        <span className="font-mono font-semibold text-foreground">{driver.licenseNumber}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">DL Verification Status</span>
                        <span><StatusBadge status={driver.dlVerifStatus} /></span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Date of Birth (SARATHI)</span>
                        <span className="text-foreground">{fmtDate(driver.dob)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Permit Vehicle Classes</span>
                        <span className="font-semibold text-foreground">{driver.permitTypes || "LMV, HGV"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">SARATHI Verified At</span>
                        <span className="text-foreground">{fmtDateTime(driver.dlVerifiedAt)}</span>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* ── TAB 4: BANK & PAYOUTS ── */}
                <TabsContent value="bank" className="space-y-4 mt-2">
                  <Card className="p-4 shadow-2xs border space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Bank & Settlement Account</h4>
                        <p className="text-xs text-muted-foreground">Linked for automated RazorpayX withdrawals & cash settlements</p>
                      </div>
                      {driver.bankVerified ? (
                        <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Penny-Drop Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Verification Pending
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Account Holder Name</span>
                        <span className="font-semibold text-foreground">{driver.bankAccountHolderName || driver.user?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Bank Name</span>
                        <span className="font-semibold text-foreground">{driver.bankName || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Bank Account Number</span>
                        <span className="font-mono font-bold text-foreground">{driver.bankAccountNo || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">IFSC Code</span>
                        <span className="font-mono font-bold text-foreground">{driver.bankIfsc || "—"}</span>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* ── TAB 5: KYC DOCUMENTS ── */}
                <TabsContent value="documents" className="space-y-4 mt-2">
                  {driver.documents?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {driver.documents.map((doc: DriverDocument) => (
                        <Card key={doc.id} className="p-3 shadow-2xs border flex flex-col justify-between space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px] font-semibold">
                              {doc.type?.replace(/_/g, " ")}
                            </Badge>
                            <StatusBadge status={doc.status} />
                          </div>

                          <div className="h-32 w-full rounded border bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center relative group">
                            {doc.fileUrl ? (
                              <img
                                src={doc.fileUrl}
                                alt={doc.type}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                                onClick={() => setPreviewDoc({ url: doc.fileUrl, title: doc.type })}
                              />
                            ) : (
                              <FileText className="h-8 w-8 text-muted-foreground/40" />
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                            <span>Uploaded {fmtDate(doc.createdAt)}</span>
                            {doc.fileUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-1.5 text-xs text-primary"
                                onClick={() => setPreviewDoc({ url: doc.fileUrl, title: doc.type })}
                              >
                                <Eye className="h-3 w-3 mr-1" /> View Full
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground space-y-1 border rounded-lg">
                      <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                      <p className="font-semibold text-xs text-foreground">No documents uploaded</p>
                      <p className="text-[11px] text-muted-foreground">Driver has not submitted KYC scans yet.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Full Size Preview Dialog */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-3xl p-4">
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="text-sm font-semibold">{previewDoc.title?.replace(/_/g, " ")}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center max-h-[75vh] overflow-hidden rounded bg-black/5 p-2">
              <img src={previewDoc.url} alt={previewDoc.title} className="max-h-[70vh] w-auto object-contain rounded" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button asChild size="sm" variant="outline">
                <a href={previewDoc.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open in New Tab
                </a>
              </Button>
              <Button size="sm" onClick={() => setPreviewDoc(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
