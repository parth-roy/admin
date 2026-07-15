import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Copy, MapPin, Phone, Receipt, Star, XCircle, Loader2,
  UserCheck, AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useBooking, useCancelBooking, useRefundBooking } from "@/hooks/useBookings";
import type { BookingStop } from "@/lib/api/types";

export const Route = createFileRoute("/bookings/$id")({
  head: () => ({ meta: [{ title: "Booking detail — Parther Admin" }] }),
  component: BookingDetail,
});

const STEPS = ["DRAFT", "CONFIRMED", "DRIVER_ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "COMPLETED"];

function BookingDetail() {
  const { id } = useParams({ from: "/bookings/$id" });
  const { data: b, isLoading, error } = useBooking(id);

  const cancelMut = useCancelBooking();
  const refundMut = useRefundBooking();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState("");

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-14 w-80" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !b) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <AlertTriangle className="h-8 w-8" />
        <p>Booking not found</p>
        <Button asChild variant="outline" size="sm"><Link to="/bookings"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link></Button>
      </div>
    );
  }

  const currentStep = STEPS.indexOf(b.status as string);
  const stops = b.stops ?? [];
  const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const handleCancel = async () => {
    try {
      await cancelMut.mutateAsync({ bookingId: id, reason: cancelReason });
      toast.success("Booking cancelled");
      setCancelOpen(false);
      setCancelReason("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Cancel failed");
    }
  };

  const handleRefund = async () => {
    const amt = parseFloat(refundAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await refundMut.mutateAsync({ bookingId: id, amount: amt, note: refundNote });
      toast.success(`₹${amt.toLocaleString("en-IN")} refunded to wallet`);
      setRefundOpen(false);
      setRefundAmount("");
      setRefundNote("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Refund failed");
    }
  };

  return (
    <div>
      <PageHeader
        title={b.bookingNumber}
        description={`${b.customer?.name ?? b.customer?.phone ?? "Customer"} · ${fmtDate(b.createdAt)}`}
        actions={
          <>
            <Button asChild variant="ghost" size="sm"><Link to="/bookings"><ArrowLeft className="h-4 w-4" />Back</Link></Button>
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(id); toast.success("ID copied"); }}>
              <Copy className="h-4 w-4" />Copy ID
            </Button>
            {!["COMPLETED", "CANCELLED"].includes(b.status as string) && (
              <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
                <XCircle className="h-4 w-4" />Cancel booking
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Status timeline</CardTitle>
              <StatusBadge status={b.status as string} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex flex-1 flex-col items-center">
                    <div className="relative w-full flex items-center">
                      {i > 0 && <div className={`h-0.5 flex-1 ${i <= currentStep ? "bg-success" : "bg-muted"}`} />}
                      <div className={`mx-auto grid h-7 w-7 place-items-center rounded-full border-2 text-[10px] font-semibold ${
                        i <= currentStep ? "border-success bg-success text-success-foreground" : "border-muted bg-background text-muted-foreground"
                      }`}>{i + 1}</div>
                      {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < currentStep ? "bg-success" : "bg-muted"}`} />}
                    </div>
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground text-center">{s.replace(/_/g, " ")}</p>
                  </div>
                ))}
              </div>
              {b.cancellationReason && (
                <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-medium text-destructive">Cancellation reason</p>
                  <p className="text-muted-foreground mt-1">{b.cancellationReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Route / Stops */}
          <Card>
            <CardHeader><CardTitle className="text-base">Route stops</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {stops.length > 0 ? (
                stops.sort((a: BookingStop, b: BookingStop) => a.sequence - b.sequence).map((stop: BookingStop, idx: number) => (
                  <div key={stop.id}>
                    <div className="flex gap-3">
                      <div className={`mt-1 h-3 w-3 flex-shrink-0 rounded-full ring-4 ${
                        idx === 0 ? "bg-success ring-success/20" : idx === stops.length - 1 ? "bg-destructive ring-destructive/20" : "bg-primary ring-primary/20"
                      }`} />
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          {idx === 0 ? "Pickup" : idx === stops.length - 1 ? "Drop" : `Stop ${idx}`}
                        </p>
                        <p className="text-sm font-medium">{stop.address}</p>
                        {stop.lat && <p className="text-xs text-muted-foreground">{stop.lat.toFixed(5)}, {stop.lng?.toFixed(5)}</p>}
                      </div>
                    </div>
                    {idx < stops.length - 1 && <div className="ml-1.5 h-6 border-l-2 border-dashed border-muted-foreground/40" />}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No stop data</p>
              )}
            </CardContent>
          </Card>

          {/* GPS Map placeholder */}
          <Card>
            <CardHeader><CardTitle className="text-base">Live GPS trail</CardTitle></CardHeader>
            <CardContent>
              <div className="relative h-64 overflow-hidden rounded-lg border bg-[linear-gradient(135deg,oklch(0.94_0.02_240),oklch(0.97_0.01_240))]">
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }} />
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <path d="M40,160 Q120,40 200,100 T360,40" stroke="var(--color-primary)" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <circle cx="40" cy="160" r="6" fill="var(--color-success)" />
                  <circle cx="360" cy="40" r="6" fill="var(--color-destructive)" />
                </svg>
                <div className="absolute bottom-3 left-3 rounded-md bg-card/90 px-3 py-2 text-xs backdrop-blur">
                  <p className="font-medium">GPS integration pending</p>
                  <p className="text-muted-foreground">Live tracking via socket</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{b.customer?.name ?? "—"}</p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />{b.customer?.phone}
              </p>
              <Button asChild variant="outline" size="sm" className="w-full mt-2">
                <Link to="/customers">View profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Driver */}
          <Card>
            <CardHeader><CardTitle className="text-base">Driver</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {b.driver ? (
                <>
                  <p className="font-medium">{b.driver.user?.name ?? "—"}</p>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />{b.driver.user?.phone}
                  </p>
                  {b.earning && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Driver net</span>
                      <span className="font-mono">₹{Number(b.earning.driverNet).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link to="/drivers">View driver</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-warning-foreground bg-warning/20 inline-block rounded px-2 py-1 text-xs">No driver assigned</p>
                  <Button asChild size="sm" className="w-full mt-2">
                    <Link to="/dispatch">Go to Dispatch Queue</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader><CardTitle className="text-base">Payment</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={b.paymentStatus as string} />
              </div>
              {b.pricingAuditLog && b.pricingAuditLog.length > 0 && (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Base Subtotal</span>
                    <span className="font-mono">₹{Number(b.pricingAuditLog[0].totalFare ?? b.totalFare ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>GST (Platform remits)</span>
                    <span className="font-mono">₹{Number(b.gstAmount ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Platform Commission</span>
                    <span className="font-mono text-primary">₹{Number(b.pricingAuditLog[0].platformRevenue ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Driver Net Payout</span>
                    <span className="font-mono text-success">₹{Number(b.pricingAuditLog[0].driverPayout ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                  <Separator className="my-2" />
                </>
              )}
              <div className="flex justify-between font-medium">
                <span>Grand Total (Customer Paid)</span>
                <span className="font-mono text-base tabular-nums">₹{Number(b.grandTotal ?? b.totalFare ?? 0).toLocaleString("en-IN")}</span>
              </div>
              <Button
                variant="outline" size="sm" className="w-full"
                onClick={() => setRefundOpen(true)}
                disabled={b.paymentStatus === "REFUNDED"}
              >
                <Receipt className="h-4 w-4" />Issue refund
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel booking {b.bookingNumber}?</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Cancellation reason *</Label>
            <Input
              placeholder="Enter reason for cancellation…"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Back</Button>
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

      {/* Refund Dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue refund for {b.bookingNumber}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Refund amount (₹) *</Label>
              <Input
                type="number"
                placeholder={`Max: ${b.totalFare}`}
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Note</Label>
              <Input
                placeholder="Reason for refund…"
                value={refundNote}
                onChange={e => setRefundNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button
              disabled={!refundAmount || refundMut.isPending}
              onClick={handleRefund}
            >
              {refundMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Issue refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
