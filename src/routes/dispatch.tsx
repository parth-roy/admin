import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Radio,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  PhoneCall,
  CheckCircle2,
  Clock,
  Truck,
  MessageSquare,
  ExternalLink,
  User,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useBookings, useAssignDriver } from "@/hooks/useBookings";
import { useDrivers } from "@/hooks/useDrivers";
import {
  useDispatchAlerts,
  useResolveDispatchAlert,
  useDisintermediationFeed,
} from "@/hooks/useDispatchAlerts";
import type { BookingListItem, DriverListItem } from "@/lib/api/types";

export const Route = createFileRoute("/dispatch")({
  head: () => ({ meta: [{ title: "Dispatch & Ops Alerts — Parther Admin" }] }),
  component: DispatchCommandCenter,
});

function DispatchCommandCenter() {
  const [activeTab, setActiveTab] = useState<string>("alerts");
  const [assignOpen, setAssignOpen] = useState<string | null>(null); // bookingId
  const [driverSearch, setDriverSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // 1. SLA & Dispatch Alerts
  const {
    data: alertsData,
    isLoading: alertsLoading,
    isFetching: alertsFetching,
    refetch: refetchAlerts,
  } = useDispatchAlerts({ isResolved: "false" });
  const resolveAlertMut = useResolveDispatchAlert();

  // 2. Telemetry & Anti-Disintermediation Feed
  const {
    data: telemetryData,
    isLoading: telemetryLoading,
    isFetching: telemetryFetching,
    refetch: refetchTelemetry,
  } = useDisintermediationFeed({ limit: 50 });

  // 3. Unassigned Bookings Queue
  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    isFetching: bookingsFetching,
    refetch: refetchBookings,
  } = useBookings({
    status: "CONFIRMED",
    unassigned: true,
    limit: 50,
    page: 1,
  });

  // Available Drivers
  const { data: availableDrivers, isLoading: driversLoading } = useDrivers({
    status: "AVAILABLE",
    search: driverSearch || undefined,
    limit: 20,
    page: 1,
  });

  const assignMut = useAssignDriver();

  const alerts = alertsData?.data ?? [];
  const telemetry = telemetryData?.data ?? [];
  const queue = bookingsData?.data ?? [];

  const unresolvedSlaAlertsCount = alerts.filter(
    (a) => a.severity === "CRITICAL_TIMEOUT" && !a.isResolved
  ).length;

  const suspiciousActionsCount = telemetry.filter(
    (t) =>
      t.action === "PHONE_CALL_INITIATED" || t.action === "WHATSAPP_CLICKED"
  ).length;

  const fmtWait = (iso?: string | null) => {
    if (!iso) return "—";
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const handleAssign = async () => {
    if (!assignOpen || !selectedDriver) return;
    try {
      await assignMut.mutateAsync({
        bookingId: assignOpen,
        driverId: selectedDriver,
      });
      toast.success("Driver assigned successfully");
      setAssignOpen(null);
      setSelectedDriver(null);
      setDriverSearch("");
      refetchBookings();
      refetchAlerts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Assignment failed");
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      await resolveAlertMut.mutateAsync({
        id,
        notes: "Resolved by Admin via Dispatch Command Center",
      });
      toast.success("Alert marked as resolved");
      refetchAlerts();
    } catch (e: any) {
      toast.error("Failed to resolve alert");
    }
  };

  const isGlobalFetching =
    alertsFetching || telemetryFetching || bookingsFetching;

  const refetchAll = () => {
    refetchAlerts();
    refetchTelemetry();
    refetchBookings();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch Operations & Anti-Disintermediation Monitor"
        description="Real-time monitoring of 5-minute unassigned load SLA timeouts, driver external contacts, and manual driver fulfillment."
        actions={
          <div className="flex items-center gap-2">
            {isGlobalFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Button size="sm" variant="outline" onClick={refetchAll}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Live Refresh
            </Button>
          </div>
        }
      />

      <div className="p-6 pt-0 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  5-Min SLA Critical Escalations
                </p>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              {alertsLoading ? (
                <Skeleton className="mt-2 h-9 w-16" />
              ) : (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-destructive">
                    {unresolvedSlaAlertsCount}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Requires immediate call
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Off-Platform Leakage Flags
                </p>
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              {telemetryLoading ? (
                <Skeleton className="mt-2 h-9 w-16" />
              ) : (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {suspiciousActionsCount}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Call / WhatsApp attempts
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Unassigned Queue
                </p>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              {bookingsLoading ? (
                <Skeleton className="mt-2 h-9 w-16" />
              ) : (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold">
                    {queue.length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Pending truck match
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Available Drivers
                </p>
                <Truck className="h-4 w-4 text-emerald-600" />
              </div>
              {driversLoading ? (
                <Skeleton className="mt-2 h-9 w-16" />
              ) : (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-emerald-600">
                    {availableDrivers?.total ?? 0}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Online & idle
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl bg-muted/60 p-1">
            <TabsTrigger value="alerts" className="relative flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span>SLA Escalations</span>
              {unresolvedSlaAlertsCount > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px] h-4">
                  {unresolvedSlaAlertsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="telemetry" className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span>Driver Activity & Leakage</span>
              {suspiciousActionsCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] h-4 bg-amber-500/20 text-amber-700">
                  {suspiciousActionsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              <span>Dispatch Queue</span>
              {queue.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] h-4">
                  {queue.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SLA Escalations */}
          <TabsContent value="alerts">
            <Card>
              <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Urgent Customer Reach-Out Required (5-Minute Timeout Exceeded)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Customer is waiting on Home or Search Modal. Contact the customer immediately or assign an idle driver manually.
                  </p>
                </div>
                <Badge variant="outline" className="self-start sm:self-auto font-mono text-xs">
                  Auto-checks every 30s
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking #</TableHead>
                    <TableHead>Customer Details</TableHead>
                    <TableHead>Route (Pickup → Drop)</TableHead>
                    <TableHead>Vehicle & Fare</TableHead>
                    <TableHead>Wait Time</TableHead>
                    <TableHead className="text-right">Immediate Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : alerts.length ? (
                    alerts.map((alt) => (
                      <TableRow key={alt.id} className="bg-destructive/[0.02] hover:bg-destructive/[0.05]">
                        <TableCell>
                          <Link
                            to="/bookings/$id"
                            params={{ id: alt.booking?.id ?? alt.bookingId }}
                            className="font-mono text-xs text-primary font-bold hover:underline flex items-center gap-1"
                          >
                            {alt.booking?.bookingNumber ?? "Load"}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <span className="text-[10px] text-destructive font-semibold block mt-0.5">
                            {alt.severity.replace(/_/g, " ")}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-sm">
                            {alt.booking?.customer?.name || "Verified Customer"}
                          </div>
                          {alt.booking?.customer?.phone && (
                            <a
                              href={`tel:${alt.booking.customer.phone}`}
                              className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <PhoneCall className="h-3 w-3" />
                              {alt.booking.customer.phone}
                            </a>
                          )}
                        </TableCell>

                        <TableCell className="max-w-xs">
                          <div className="text-xs truncate font-medium" title={alt.booking?.pickupAddress}>
                            📍 <span className="text-muted-foreground">From:</span> {alt.booking?.pickupAddress}
                          </div>
                          <div className="text-xs truncate text-muted-foreground mt-0.5" title={alt.booking?.dropAddress}>
                            🏁 <span className="text-muted-foreground">To:</span> {alt.booking?.dropAddress}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[11px] mb-1">
                            {alt.booking?.vehicleType?.replace(/_/g, " ")}
                          </Badge>
                          <div className="font-mono text-xs font-bold text-foreground">
                            ₹{Number(alt.booking?.totalFare ?? 0).toLocaleString("en-IN")}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" />
                            {fmtWait(alt.createdAt)}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {alt.booking?.customer?.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-50"
                                asChild
                              >
                                <a href={`tel:${alt.booking.customer.phone}`}>
                                  <PhoneCall className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                  Call
                                </a>
                              </Button>
                            )}

                            <Button
                              size="sm"
                              className="h-8 text-xs bg-primary hover:bg-primary/90"
                              onClick={() => {
                                setAssignOpen(alt.booking?.id ?? alt.bookingId);
                                setSelectedDriver(null);
                                setDriverSearch("");
                              }}
                            >
                              <Truck className="h-3.5 w-3.5 mr-1" />
                              Assign
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => handleResolveAlert(alt.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Resolve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                        <p className="font-medium text-foreground">No active SLA timeouts</p>
                        <p className="text-xs">All bookings are being matched within the 5-minute commitment.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: Anti-Disintermediation & Driver Telemetry */}
          <TabsContent value="telemetry">
            <Card>
              <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="h-4 w-4" />
                    Live Driver Action Telemetry & Off-Platform Leakage Audit
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Logs every Call, WhatsApp, and Bid attempt on unassigned freight to prevent off-platform cash deals.
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Driver Profile</TableHead>
                    <TableHead>Action Detected</TableHead>
                    <TableHead>Load / Customer</TableHead>
                    <TableHead>Off-Platform Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {telemetryLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : telemetry.length ? (
                    telemetry.map((t) => {
                      const isHighRisk =
                        t.action === "PHONE_CALL_INITIATED" ||
                        t.action === "WHATSAPP_CLICKED";
                      return (
                        <TableRow key={t.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {new Date(t.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                            <span className="block text-[10px]">{fmtWait(t.createdAt)} ago</span>
                          </TableCell>

                          <TableCell>
                            <div className="font-semibold text-sm flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {t.driver?.user?.name || "Driver"}
                            </div>
                            <div className="text-xs font-mono text-muted-foreground mt-0.5">
                              {t.driver?.user?.phone} · {t.driver?.vehicle?.registrationNo ?? "No Vehicle"}
                            </div>
                          </TableCell>

                          <TableCell>
                            {t.action === "PHONE_CALL_INITIATED" && (
                              <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 font-mono text-xs">
                                <PhoneCall className="h-3 w-3" />
                                Phone Call Initiated
                              </Badge>
                            )}
                            {t.action === "WHATSAPP_CLICKED" && (
                              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1 font-mono text-xs">
                                <MessageSquare className="h-3 w-3" />
                                WhatsApp Clicked
                              </Badge>
                            )}
                            {t.action === "BID_SUBMITTED" && (
                              <Badge variant="outline" className="gap-1 font-mono text-xs">
                                <Truck className="h-3 w-3" />
                                Custom Counter-Bid
                              </Badge>
                            )}
                            {t.action === "DETAILS_VIEWED" && (
                              <Badge variant="secondary" className="gap-1 font-mono text-xs text-muted-foreground">
                                <Eye className="h-3 w-3" />
                                Load Details Viewed
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell>
                            <Link
                              to="/bookings/$id"
                              params={{ id: t.bookingId }}
                              className="font-mono text-xs text-primary font-bold hover:underline"
                            >
                              #{t.booking?.bookingNumber ?? t.bookingId.slice(0, 8)}
                            </Link>
                            <div className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                              Customer: {t.booking?.customer?.name || "Verified Shipper"} ({t.booking?.customer?.phone || "—"})
                            </div>
                          </TableCell>

                          <TableCell>
                            {isHighRisk ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                Direct Contact Risk
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                In-Platform Action
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                        <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium">No driver telemetry logged yet</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 3: General Dispatch Queue */}
          <TabsContent value="queue">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Fare</TableHead>
                    <TableHead>Waiting</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingsLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : queue.length ? (
                    queue.map((b: BookingListItem) => (
                      <TableRow key={b.id} className="hover:bg-muted/40">
                        <TableCell>
                          <Link
                            to="/bookings/$id"
                            params={{ id: b.id }}
                            className="font-mono text-xs text-primary font-bold hover:underline"
                          >
                            {b.bookingNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{b.customer?.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{b.customer?.phone}</div>
                        </TableCell>
                        <TableCell className="text-xs">{b.vehicleType?.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          ₹{Number(b.totalFare ?? 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm font-medium ${
                              Date.now() - new Date(b.createdAt).getTime() > 300000
                                ? "text-destructive font-bold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {fmtWait(b.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setAssignOpen(b.id);
                              setSelectedDriver(null);
                              setDriverSearch("");
                            }}
                          >
                            Assign driver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                        <p className="font-medium text-foreground">Dispatch queue is clear</p>
                        <p className="text-xs">All active bookings have been assigned drivers.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Driver Dialog */}
      <Dialog
        open={!!assignOpen}
        onOpenChange={() => {
          setAssignOpen(null);
          setSelectedDriver(null);
          setDriverSearch("");
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Driver to Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Search available drivers</Label>
              <Input
                placeholder="Search by name, phone or vehicle…"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-md border p-2">
              {driversLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))
              ) : availableDrivers?.data?.length ? (
                availableDrivers.data.map((d: DriverListItem) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDriver(d.id)}
                    className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                      selectedDriver === d.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{d.user?.name ?? "—"}</div>
                    <div className="text-xs opacity-70">
                      {d.user?.phone} · {d.vehicle?.registrationNo ?? "No vehicle"} · ⭐{" "}
                      {Number(d.rating ?? 0).toFixed(1)}
                    </div>
                  </button>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No available drivers found online
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(null)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedDriver || assignMut.isPending}
              onClick={handleAssign}
            >
              {assignMut.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
