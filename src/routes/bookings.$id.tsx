import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Copy, MapPin, Phone, Receipt, Star, XCircle, Loader2,
  UserCheck, AlertTriangle, Truck, Package, Navigation, Calendar,
  Clock, CreditCard, ExternalLink, Key, FileText, CheckCircle2,
  Eye, Image as ImageIcon, IndianRupee, Zap, Shield, User,
  Share2, ChevronRight, CheckCircle,
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useBooking, useCancelBooking, useRefundBooking } from "@/hooks/useBookings";
import { useUnreadBookings } from "@/hooks/useUnreadBookings";
import { BookingRouteMap } from "@/components/BookingRouteMap";
import { AgentDriverModal } from "@/components/admin/AgentDriverModal";
import { MatchDriversModal } from "@/components/MatchDriversModal";
import type { BookingStop } from "@/lib/api/types";

export const Route = createFileRoute("/bookings/$id")({
  head: () => ({ meta: [{ title: "Booking detail — Parther Admin" }] }),
  component: BookingDetail,
});

const STEPS = ["DRAFT", "CONFIRMED", "DRIVER_ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "COMPLETED"];

function BookingDetail() {
  const { id } = useParams({ from: "/bookings/$id" });
  const { data: b, isLoading, error, refetch } = useBooking(id);
  const { markAsSeen } = useUnreadBookings();

  useEffect(() => {
    if (id) {
      markAsSeen(id);
    }
  }, [id, markAsSeen]);

  const cancelMut = useCancelBooking();
  const refundMut = useRefundBooking();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [matchDriversOpen, setMatchDriversOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-14 w-80" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !b) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="font-medium text-foreground">Booking not found or could not be loaded</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/bookings">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to All Bookings
          </Link>
        </Button>
      </div>
    );
  }

  const currentStep = STEPS.indexOf(b.status as string);
  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  // ── Normalize Stops ──
  const rawStops = b.stops ?? [];
  const sortedStops = [...rawStops].sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0));

  // Determine if pickup was duplicated in stops array
  const isPickupInStops =
    sortedStops.length > 0 &&
    b.pickupAddress &&
    sortedStops[0].address?.trim()?.toLowerCase() === b.pickupAddress?.trim()?.toLowerCase();

  const destinationStops: any[] = isPickupInStops ? sortedStops.slice(1) : sortedStops;

  // Map representation of pickup
  const mapPickup = {
    lat: Number(b.pickupLat ?? 0),
    lng: Number(b.pickupLng ?? 0),
    address: b.pickupAddress || "Pickup location",
    otp: b.pickupOtp,
  };

  // Map representation of dropoff stops
  const mapStops = destinationStops.map((s: any, idx: number) => ({
    lat: Number(s.latitude ?? s.lat ?? 0),
    lng: Number(s.longitude ?? s.lng ?? 0),
    address: s.address || "",
    receiverName: s.receiverName || b.receiverName,
    receiverPhone: s.receiverPhone || b.receiverPhone,
    sequence: idx + 1,
  }));

  // Driver location for map
  const mapDriver =
    b.driver?.currentLat && b.driver?.currentLng
      ? {
          lat: Number(b.driver.currentLat),
          lng: Number(b.driver.currentLng),
          name: b.driver.user?.name || "Assigned Driver",
          phone: b.driver.user?.phone,
        }
      : null;

  // ── Financial Calculations ──
  const isAudit = b.pricingAuditLog && b.pricingAuditLog.length > 0;
  const audit = isAudit ? b.pricingAuditLog[0] : null;
  const hasEarning = !!b.earning;

  const totalFare = Number(b.totalFare ?? audit?.totalFare ?? 0);
  const baseFare = b.baseFare != null ? Number(b.baseFare) : null;
  const distanceFare =
    b.distanceFare != null
      ? Number(b.distanceFare)
      : baseFare != null && totalFare > baseFare
      ? totalFare - baseFare
      : null;
  const fuelSurcharge = b.fuelSurcharge ? Number(b.fuelSurcharge) : 0;
  const loadingCharge = Number(b.loadingCharge ?? b.laborCharge ?? 0);
  const tollCharge = Number(b.tollCharge ?? 0);
  const waitingCharge = Number(b.waitingCharge ?? 0);
  const discount = Number((b.discountAmount ?? 0) + (b.coinsRedeemed ?? 0));
  const gstAmount = Number(b.gstAmount ?? b.taxAmount ?? audit?.taxAmount ?? 0);
  const grandTotal = Number(
    b.grandTotal ?? totalFare + gstAmount + tollCharge + waitingCharge - discount
  );

  const commission = Number(
    audit?.commissionAmount ??
      (hasEarning && b.earning ? b.earning.commission : Math.round(totalFare * 0.1))
  );

  const driverNet = Number(
    audit?.driverPayout ??
      (hasEarning && b.earning ? b.earning.netAmount : Math.max(0, totalFare - commission))
  );

  const handleCancel = async () => {
    try {
      await cancelMut.mutateAsync({ bookingId: id, reason: cancelReason });
      toast.success("Booking cancelled successfully");
      setCancelOpen(false);
      setCancelReason("");
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Cancel failed");
    }
  };

  const handleRefund = async () => {
    const amt = parseFloat(refundAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await refundMut.mutateAsync({ bookingId: id, amount: amt, note: refundNote });
      toast.success(`₹${amt.toLocaleString("en-IN")} refunded to customer wallet`);
      setRefundOpen(false);
      setRefundAmount("");
      setRefundNote("");
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Refund failed");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── TOP HEADER ── */}
      <PageHeader
        title={b.bookingNumber}
        description={`${b.customer?.name ?? b.customer?.phone ?? "Customer"} · Booked on ${fmtDate(
          b.createdAt
        )}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="h-9">
              <Link to="/bookings">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to All Bookings
              </Link>
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-9 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90"
              onClick={() => setMatchDriversOpen(true)}
            >
              <UserCheck className="h-4 w-4" /> Match Available Drivers
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => {
                navigator.clipboard.writeText(b.bookingNumber || id);
                toast.success("Booking ID copied to clipboard");
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy ID
            </Button>
            {!["COMPLETED", "CANCELLED"].includes(b.status as string) && (
              <Button
                variant="destructive"
                size="sm"
                className="h-9 gap-1.5"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel booking
              </Button>
            )}
          </div>
        }
      />

      {/* Main Container */}
      <div className="grid gap-6 px-6 lg:grid-cols-3">
        {/* ── LEFT COLUMN (2 Cols) ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status Timeline */}
          <Card className="shadow-xs border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Status Timeline</CardTitle>
                <CardDescription className="text-xs">Trip progression and milestone tracker</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {b.hasAgentDriver && (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 text-xs">
                    <Zap className="h-3 w-3 fill-amber-500" /> Agent Sourced
                  </Badge>
                )}
                <StatusBadge status={b.status as string} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-2">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex flex-1 flex-col items-center">
                    <div className="relative w-full flex items-center">
                      {i > 0 && (
                        <div
                          className={`h-0.5 flex-1 transition-colors ${
                            i <= currentStep ? "bg-emerald-500" : "bg-muted"
                          }`}
                        />
                      )}
                      <div
                        className={`mx-auto grid h-7 w-7 place-items-center rounded-full border-2 text-[10px] font-bold transition-all ${
                          i <= currentStep
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                            : "border-muted-foreground/30 bg-background text-muted-foreground"
                        }`}
                      >
                        {i <= currentStep ? "✓" : i + 1}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 transition-colors ${
                            i < currentStep ? "bg-emerald-500" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center line-clamp-1">
                      {s.replace(/_/g, " ")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Cancellation Banner */}
              {b.cancellationReason && (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm animate-in fade-in">
                  <div className="flex items-center gap-2 font-semibold text-destructive">
                    <XCircle className="h-4 w-4" />
                    <span>Booking Cancelled {b.cancelledBy ? `by ${b.cancelledBy}` : ""}</span>
                    {b.cancellationTime && (
                      <span className="text-xs font-normal text-muted-foreground">
                        ({fmtDate(b.cancellationTime)})
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1.5 pl-6">{b.cancellationReason}</p>
                </div>
              )}

              {/* Milestone Timestamps */}
              {(b.actualPickupTime || b.actualDeliveryTime) && (
                <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t text-xs">
                  {b.actualPickupTime && (
                    <div>
                      <span className="text-muted-foreground">Actual Pickup:</span>{" "}
                      <span className="font-semibold text-foreground">{fmtDate(b.actualPickupTime)}</span>
                    </div>
                  )}
                  {b.actualDeliveryTime && (
                    <div>
                      <span className="text-muted-foreground">Actual Delivery:</span>{" "}
                      <span className="font-semibold text-foreground">{fmtDate(b.actualDeliveryTime)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactive Live GPS & Route Map */}
          <Card className="shadow-xs border overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  Live GPS & Route Map
                </CardTitle>
                <CardDescription className="text-xs">
                  Interactive trip coordinates from origin to destination
                </CardDescription>
              </div>
              {b.estimatedDistance && (
                <div className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                  {Number(b.estimatedDistance).toLocaleString("en-IN")} km trip
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <BookingRouteMap
                pickup={mapPickup}
                stops={mapStops}
                driver={mapDriver}
                locationHistory={b.locationHistory}
                estimatedDistance={b.estimatedDistance}
                estimatedDuration={b.estimatedDuration}
              />
            </CardContent>
          </Card>

          {/* Complete Route Stops */}
          <Card className="shadow-xs border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Route Stops & Delivery Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Confirmed pickup and dropoff points for this booking
                </CardDescription>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                {1 + destinationStops.length} stop{1 + destinationStops.length === 1 ? "" : "s"} total
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 1. PICKUP STOP */}
              <div className="rounded-lg border bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 p-4">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs shadow-xs">
                    P
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Pickup Location (Origin)
                        </span>
                        {b.pickupOtp && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-mono font-bold px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                            <Key className="h-3 w-3" /> OTP: {b.pickupOtp}
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 border-emerald-300">
                        {b.actualPickupTime ? "Picked Up" : ["CONFIRMED", "DRIVER_ASSIGNED", "IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(b.status) ? "Confirmed" : "Draft"}
                      </Badge>
                    </div>

                    <p className="mt-1.5 text-sm font-semibold text-foreground">
                      {b.pickupAddress || "Address not provided"}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
                      {b.pickupLat && b.pickupLng && (
                        <span className="font-mono text-[11px]">
                          📍 {b.pickupLat.toFixed(5)}, {b.pickupLng.toFixed(5)}
                        </span>
                      )}
                      <span>
                        Sender: <strong className="text-foreground">{b.customer?.name || "Customer"}</strong>{" "}
                        {b.customer?.phone && `(${b.customer.phone})`}
                      </span>
                      {b.actualPickupTime && (
                        <span>
                          Time: <strong className="text-foreground">{fmtDate(b.actualPickupTime)}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transit Connector Line */}
              <div className="relative pl-7 py-1">
                <div className="absolute left-[27px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-primary/40" />
                <div className="flex items-center gap-2 text-xs font-semibold text-primary py-1">
                  <Navigation className="h-3.5 w-3.5 rotate-45" />
                  <span>
                    {b.estimatedDistance ? `${Number(b.estimatedDistance).toLocaleString("en-IN")} km` : "Distance"}{" "}
                    {b.estimatedDuration ? `· Approx ${b.estimatedDuration} mins transit` : ""}
                  </span>
                </div>
              </div>

              {/* 2. DROPOFF / DESTINATION STOPS */}
              {destinationStops.length > 0 ? (
                destinationStops.map((stop: any, idx: number) => {
                  const isFinal = idx === destinationStops.length - 1;
                  const lat = stop.latitude ?? stop.lat;
                  const lng = stop.longitude ?? stop.lng;
                  const receiver = stop.receiverName || b.receiverName;
                  const receiverPhone = stop.receiverPhone || b.receiverPhone;

                  return (
                    <div
                      key={stop.id || idx}
                      className={`rounded-lg border p-4 ${
                        isFinal
                          ? "bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                          : "bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white font-bold text-xs shadow-xs ${
                            isFinal ? "bg-red-500" : "bg-amber-500"
                          }`}
                        >
                          {isFinal ? "D" : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={`text-xs font-bold uppercase tracking-wider ${
                                isFinal
                                  ? "text-rose-700 dark:text-rose-400"
                                  : "text-amber-700 dark:text-amber-400"
                              }`}
                            >
                              {isFinal
                                ? destinationStops.length > 1
                                  ? `Final Destination (Stop ${idx + 1})`
                                  : "Dropoff Destination"
                                : `Drop Stop ${idx + 1}`}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-semibold ${
                                stop.isCompleted || b.status === "DELIVERED" || b.status === "COMPLETED"
                                  ? "text-emerald-700 border-emerald-300"
                                  : "text-amber-700 border-amber-300"
                              }`}
                            >
                              {stop.isCompleted || b.status === "DELIVERED" || b.status === "COMPLETED"
                                ? "Delivered"
                                : "Pending Delivery"}
                            </Badge>
                          </div>

                          <p className="mt-1.5 text-sm font-semibold text-foreground">
                            {stop.address || "Address not provided"}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
                            {lat && lng && (
                              <span className="font-mono text-[11px]">
                                📍 {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
                              </span>
                            )}
                            {receiver && (
                              <span>
                                Receiver: <strong className="text-foreground">{receiver}</strong>{" "}
                                {receiverPhone && `(${receiverPhone})`}
                              </span>
                            )}
                            {stop.isCompleted && b.actualDeliveryTime && (
                              <span>
                                Delivered: <strong className="text-foreground">{fmtDate(b.actualDeliveryTime)}</strong>
                              </span>
                            )}
                            {stop.podPhotoUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewImage({
                                    url: stop.podPhotoUrl,
                                    title: `Proof of Delivery — Stop ${idx + 1}`,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                              >
                                <Eye className="h-3.5 w-3.5" /> View POD Photo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  <p>Destination details awaiting driver drop point confirmation</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goods & Load Details */}
          <Card className="shadow-xs border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Goods & Load Details
              </CardTitle>
              <CardDescription className="text-xs">Cargo specifications and special handling instructions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="rounded-md border bg-muted/20 p-3">
                  <span className="text-xs text-muted-foreground block">Goods Category</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{b.goodsType || "General Goods"}</span>
                </div>
                <div className="rounded-md border bg-muted/20 p-3">
                  <span className="text-xs text-muted-foreground block">Declared Weight</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {b.goodsWeightKg ? `${b.goodsWeightKg} kg` : "Standard Cargo"}
                  </span>
                </div>
                <div className="rounded-md border bg-muted/20 p-3">
                  <span className="text-xs text-muted-foreground block">Quantity</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {b.goodsQuantity ? `${b.goodsQuantity} units/packages` : "1 unit"}
                  </span>
                </div>
                <div className="rounded-md border bg-muted/20 p-3">
                  <span className="text-xs text-muted-foreground block">Dimensions (L × W × H)</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {b.goodsLengthCm && b.goodsWidthCm && b.goodsHeightCm
                      ? `${b.goodsLengthCm} × ${b.goodsWidthCm} × ${b.goodsHeightCm} cm`
                      : "Standard"}
                  </span>
                </div>
                <div className="rounded-md border bg-muted/20 p-3">
                  <span className="text-xs text-muted-foreground block">Declared Cargo Value</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {b.declaredGoodsValue
                      ? `₹${Number(b.declaredGoodsValue).toLocaleString("en-IN")}`
                      : "Not declared"}
                  </span>
                </div>
                <div className="rounded-md border bg-muted/20 p-3">
                  <span className="text-xs text-muted-foreground block">Loading Labor Service</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {b.hasLoadingService || b.laborRequired
                      ? `Required (${b.laborersCount ?? 1} helpers)`
                      : "Self Loading"}
                  </span>
                </div>
              </div>

              {b.goodsDescription && (
                <div className="mt-4 rounded-md border bg-muted/10 p-3 text-xs">
                  <span className="text-muted-foreground font-medium block">Goods Description:</span>
                  <p className="mt-1 font-medium text-foreground">{b.goodsDescription}</p>
                </div>
              )}

              {b.handlingInstructions && (
                <div className="mt-3 rounded-md border border-amber-300/40 bg-amber-50/30 dark:bg-amber-950/20 p-3 text-xs">
                  <span className="text-amber-800 dark:text-amber-300 font-semibold block">⚠️ Handling Instructions:</span>
                  <p className="mt-1 text-foreground">{b.handlingInstructions}</p>
                </div>
              )}

              {/* Cargo Photos */}
              {b.goodsImageUrls && b.goodsImageUrls.length > 0 && (
                <div className="mt-4">
                  <span className="text-xs font-semibold text-muted-foreground block mb-2">Uploaded Cargo Images:</span>
                  <div className="flex flex-wrap gap-3">
                    {b.goodsImageUrls.map((url: string, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewImage({ url, title: `Cargo Photo ${i + 1}` })}
                        className="group relative h-20 w-20 overflow-hidden rounded-lg border bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      >
                        <img src={url} alt={`Cargo ${i + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT COLUMN (1 Col) ── */}
        <div className="space-y-6">
          {/* Detailed Payment & Rate Breakdown */}
          <Card className="shadow-xs border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  Rates & Fare Breakdown
                </CardTitle>
                <CardDescription className="text-xs">Pricing, taxes, and driver earnings</CardDescription>
              </div>
              <StatusBadge status={b.paymentStatus as string} />
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-xs pb-1 border-b">
                <span className="text-muted-foreground">Vehicle Requested</span>
                <span className="font-bold text-foreground uppercase tracking-wide">
                  {b.vehicleType?.replace(/_/g, " ") || "TRUCK"}
                </span>
              </div>

              {/* Fare Line Items */}
              {baseFare != null && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Base Minimum Fare</span>
                  <span className="font-mono text-foreground">₹{baseFare.toLocaleString("en-IN")}</span>
                </div>
              )}

              {distanceFare != null && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Distance Charge ({b.estimatedDistance ?? "—"} km)</span>
                  <span className="font-mono text-foreground">₹{distanceFare.toLocaleString("en-IN")}</span>
                </div>
              )}

              {fuelSurcharge > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Fuel Surcharge</span>
                  <span className="font-mono text-foreground">₹{fuelSurcharge.toLocaleString("en-IN")}</span>
                </div>
              )}

              {loadingCharge > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Loading / Labor Charge</span>
                  <span className="font-mono text-foreground">₹{loadingCharge.toLocaleString("en-IN")}</span>
                </div>
              )}

              {tollCharge > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Fastag / Toll Charges</span>
                  <span className="font-mono text-foreground">₹{tollCharge.toLocaleString("en-IN")}</span>
                </div>
              )}

              {waitingCharge > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Waiting Charges</span>
                  <span className="font-mono text-foreground">₹{waitingCharge.toLocaleString("en-IN")}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                  <span>Discount / Reward Coins</span>
                  <span className="font-mono font-medium">-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-xs font-semibold text-foreground pt-1 border-t">
                <span>Subtotal (Pre-GST Fare)</span>
                <span className="font-mono">₹{totalFare.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>GST (Platform remits)</span>
                <span className="font-mono">₹{gstAmount.toLocaleString("en-IN")}</span>
              </div>

              <Separator className="my-2" />

              <div className="flex justify-between items-center font-bold text-base bg-muted/30 p-2.5 rounded-lg border">
                <span className="text-foreground">Grand Total</span>
                <span className="font-mono text-lg text-primary tabular-nums">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Platform & Driver Split */}
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5 text-xs mt-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Commission</span>
                  <span className="font-mono font-semibold text-primary">₹{commission.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Driver Net Payout</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{driverNet.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Payment Method & Transaction ID */}
              <div className="pt-2 text-xs space-y-1 border-t text-muted-foreground">
                <div className="flex justify-between">
                  <span>Payment Mode:</span>
                  <span className="font-semibold text-foreground">{b.paymentMethod || "Online / UPI"}</span>
                </div>
                {(b.paymentRef || b.razorpayOrderId) && (
                  <div className="flex justify-between items-center">
                    <span>Payment Ref:</span>
                    <span className="font-mono text-[11px] text-foreground truncate max-w-[160px]">
                      {b.paymentRef || b.razorpayOrderId}
                    </span>
                  </div>
                )}
              </div>

              {/* Refund Action */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setRefundOpen(true)}
                  disabled={b.paymentStatus === "REFUNDED"}
                >
                  <Receipt className="h-3.5 w-3.5 mr-1.5" />
                  {b.paymentStatus === "REFUNDED" ? "Refund Processed" : "Issue Wallet Refund"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Billing */}
          <Card className="shadow-xs border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Customer & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-foreground">{b.customer?.name ?? "Customer"}</p>
                <a
                  href={`tel:${b.customer?.phone}`}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1 font-medium"
                >
                  <Phone className="h-3.5 w-3.5" /> {b.customer?.phone}
                </a>
                {b.customer?.email && (
                  <p className="text-xs text-muted-foreground mt-0.5">{b.customer?.email}</p>
                )}
              </div>

              {b.customerNote && (
                <div className="rounded-md border bg-muted/20 p-2.5 text-xs">
                  <span className="text-muted-foreground font-semibold block">Customer Special Note:</span>
                  <p className="mt-1 text-foreground">{b.customerNote}</p>
                </div>
              )}

              {b.gstin && (
                <div className="rounded-md border bg-muted/20 p-2.5 text-xs space-y-0.5">
                  <span className="text-muted-foreground font-semibold block">Tax / GST Details:</span>
                  <p className="font-mono text-foreground font-semibold">{b.gstin}</p>
                  {b.gstBusinessName && <p className="text-muted-foreground">{b.gstBusinessName}</p>}
                </div>
              )}

              <Button asChild variant="outline" size="sm" className="w-full text-xs">
                <Link to="/customers">View Customer in Directory</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Driver & Assigned Truck */}
          <Card className="shadow-xs border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Driver & Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {b.driver ? (
                <>
                  <div>
                    <p className="font-semibold text-foreground">{b.driver.user?.name ?? "Driver Partner"}</p>
                    <a
                      href={`tel:${b.driver.user?.phone}`}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1 font-medium"
                    >
                      <Phone className="h-3.5 w-3.5" /> {b.driver.user?.phone}
                    </a>
                  </div>

                  {b.driver.vehicle && (
                    <div className="rounded-md border bg-muted/20 p-2.5 text-xs space-y-1">
                      <span className="text-muted-foreground font-semibold block">Assigned Vehicle</span>
                      <p className="font-bold text-foreground uppercase tracking-wide">
                        {b.driver.vehicle.registrationNo}
                      </p>
                      <p className="text-muted-foreground">
                        {b.driver.vehicle.type?.replace(/_/g, " ")}{" "}
                        {b.driver.vehicle.model ? `· ${b.driver.vehicle.model}` : ""}
                      </p>
                    </div>
                  )}

                  <Button asChild variant="outline" size="sm" className="w-full text-xs">
                    <Link to="/drivers">View Driver Profile</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5"
                    onClick={() => setMatchDriversOpen(true)}
                  >
                    <UserCheck className="h-3.5 w-3.5 text-primary" /> Reassign / Match Another Driver
                  </Button>
                </>
              ) : b.hasAgentDriver && b.agentDriverDetails ? (
                <div className="space-y-2">
                  <div className="rounded-md border border-amber-300/40 bg-amber-50/40 dark:bg-amber-950/20 p-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                      <Zap className="h-3.5 w-3.5 fill-amber-500" />
                      <span>Sourced via Agent {b.agentDriverDetails.agent?.name}</span>
                    </div>
                    <p className="mt-1 text-foreground">
                      Driver: <strong>{b.agentDriverDetails.driver?.name}</strong> (
                      {b.agentDriverDetails.driver?.phone})
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      Truck: <strong className="uppercase">{b.agentDriverDetails.truck?.vehicleRegNo}</strong> ·{" "}
                      {b.agentDriverDetails.truck?.vehicleType?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                    onClick={() => setAgentModalOpen(true)}
                  >
                    View Agent Driver Dossier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5"
                    onClick={() => setMatchDriversOpen(true)}
                  >
                    <UserCheck className="h-3.5 w-3.5 text-primary" /> Match Direct Onboarded Driver
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded px-2.5 py-1.5 text-xs font-medium">
                    No driver assigned yet
                  </p>
                  <Button
                    size="sm"
                    className="w-full text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                    onClick={() => setMatchDriversOpen(true)}
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Find & Match Onboarded Drivers
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full text-xs">
                    <Link to="/dispatch">Go to Dispatch Queue</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Cancel Dialog ── */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking {b.bookingNumber}?</DialogTitle>
            <DialogDescription>
              This will mark the booking as cancelled and alert customer & dispatch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Cancellation reason *</Label>
            <Input
              placeholder="e.g. Customer requested cancellation, driver unavailable…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Back
            </Button>
            <Button
              variant="destructive"
              disabled={!cancelReason || cancelMut.isPending}
              onClick={handleCancel}
            >
              {cancelMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Refund Dialog ── */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Refund — {b.bookingNumber}</DialogTitle>
            <DialogDescription>
              Credit refund amount back to customer wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Refund amount (₹) *</Label>
              <Input
                type="number"
                placeholder={`Max: ${grandTotal}`}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Internal Note</Label>
              <Input
                placeholder="Reason for refund…"
                value={refundNote}
                onChange={(e) => setRefundNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!refundAmount || refundMut.isPending} onClick={handleRefund}>
              {refundMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Issue refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Image Lightbox Modal ── */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-2xl p-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">{previewImage.title}</DialogTitle>
            </DialogHeader>
            <div className="overflow-hidden rounded-lg border bg-black/5 flex items-center justify-center max-h-[70vh]">
              <img src={previewImage.url} alt={previewImage.title} className="max-h-[68vh] w-auto object-contain" />
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" asChild>
                <a href={previewImage.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open full size
                </a>
              </Button>
              <Button size="sm" onClick={() => setPreviewImage(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Agent Driver Dossier Modal ── */}
      {agentModalOpen && (
        <AgentDriverModal
          booking={b as any}
          open={agentModalOpen}
          onOpenChange={setAgentModalOpen}
          onAssigned={() => refetch()}
        />
      )}

      {/* ── Match Onboarded Drivers Modal ── */}
      <MatchDriversModal
        open={matchDriversOpen}
        onOpenChange={setMatchDriversOpen}
        bookingId={id}
        bookingNumber={b.bookingNumber}
        pickupAddress={b.pickupAddress}
        vehicleType={b.vehicleType}
        assignedDriverId={b.driver?.id || b.driverId}
        onAssignedSuccess={() => refetch()}
      />
    </div>
  );
}
