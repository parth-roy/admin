import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  MapPin,
  Truck,
  Package,
  BadgeIndianRupee,
  Phone,
  Building,
  Calendar,
  FileText,
  Edit2,
  Trash2,
  Copy,
  Printer,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useUpdateManualBooking, useDeleteManualBooking } from "@/hooks/useManualBookings";
import type { ManualBookingRecord } from "@/lib/api/manual-bookings.api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: ManualBookingRecord | null;
  onEdit: (booking: ManualBookingRecord) => void;
}

export function ManualBookingDetailDrawer({ open, onOpenChange, booking, onEdit }: Props) {
  const updateMut = useUpdateManualBooking();
  const deleteMut = useDeleteManualBooking();

  if (!booking) return null;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateMut.mutateAsync({ id: booking.id, data: { status: newStatus } });
    } catch {
      // Handled in hook
    }
  };

  const handlePaymentStatusChange = async (newPayStatus: string) => {
    try {
      await updateMut.mutateAsync({ id: booking.id, data: { paymentStatus: newPayStatus } });
    } catch {
      // Handled in hook
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete manual booking ${booking.bookingNumber}?`)) return;
    try {
      await deleteMut.mutateAsync(booking.id);
      onOpenChange(false);
    } catch {
      // Handled in hook
    }
  };

  const copyTripSheet = () => {
    const text = `
========================================
PARTHER LOGISTICS / METROMITRA TRIP SHEET
========================================
Booking Ref: ${booking.bookingNumber}
Status: ${booking.status || "N/A"}
Source: ${booking.source || "N/A"}
Date Created: ${new Date(booking.createdAt).toLocaleDateString("en-IN")}

1. CUSTOMER / SHIPPER
Name: ${booking.customerName || "N/A"}
Phone: ${booking.customerPhone || "N/A"}
Company: ${booking.customerCompany || "N/A"}
GSTIN: ${booking.customerGstin || "N/A"}

2. ROUTE & LOCATIONS
Pickup: ${booking.pickupAddress || ""}, ${booking.pickupCity || ""}, ${booking.pickupState || ""} (${booking.pickupPincode || ""})
Pickup Time: ${booking.pickupDateTime ? new Date(booking.pickupDateTime).toLocaleString("en-IN") : "N/A"}
Drop-off: ${booking.dropoffAddress || ""}, ${booking.dropoffCity || ""}, ${booking.dropoffState || ""} (${booking.dropoffPincode || ""})
Delivery Time: ${booking.dropoffDateTime ? new Date(booking.dropoffDateTime).toLocaleString("en-IN") : "N/A"}
Est. Distance: ${booking.estimatedDistanceKm ? booking.estimatedDistanceKm + " km" : "N/A"}

3. VEHICLE & DRIVER
Vehicle Type: ${booking.vehicleType || "N/A"}
Vehicle No: ${booking.vehicleNumber || "N/A"}
Driver: ${booking.driverName || "N/A"} (${booking.driverPhone || "N/A"})
Driver DL: ${booking.driverDlNumber || "N/A"}
Transporter: ${booking.transporterName || "N/A"} (${booking.transporterPhone || "N/A"})

4. GOODS & CARGO
Category: ${booking.goodsType || "N/A"}
Description: ${booking.goodsDescription || "N/A"}
Weight: ${booking.goodsWeightTons ? booking.goodsWeightTons + " Tons" : booking.goodsWeightKg ? booking.goodsWeightKg + " Kg" : "N/A"}
Packages: ${booking.goodsQuantity || "N/A"}
Handling: ${booking.handlingInstructions || "N/A"}

5. COMMERCIALS
Quoted Fare: Rs. ${booking.quotedAmount || 0}
Driver Payout: Rs. ${booking.driverPayoutAmount || 0}
Advance Paid: Rs. ${booking.advanceReceived || 0}
Balance Due: Rs. ${booking.balanceAmount || 0}
Payment Mode: ${booking.paymentMode || "N/A"}
Payment Status: ${booking.paymentStatus || "PENDING"}

Notes: ${booking.notes || "None"}
========================================
`;
    navigator.clipboard.writeText(text.trim());
    toast.success("Trip Sheet text copied to clipboard!");
  };

  const getStatusBadge = (st?: string | null) => {
    switch (st) {
      case "CONFIRMED":
        return <Badge className="bg-emerald-500 text-white font-semibold">Confirmed</Badge>;
      case "IN_TRANSIT":
        return <Badge className="bg-sky-500 text-white font-semibold">In Transit</Badge>;
      case "TRUCK_ASSIGNED":
        return <Badge className="bg-indigo-500 text-white font-semibold">Truck Assigned</Badge>;
      case "LOADING":
        return <Badge className="bg-amber-500 text-white font-semibold">Loading</Badge>;
      case "DELIVERED":
        return <Badge className="bg-teal-600 text-white font-semibold">Delivered</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-600 text-white font-semibold">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "QUOTED":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Quoted</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Inquiry</Badge>;
    }
  };

  const getPaymentBadge = (pst?: string | null) => {
    switch (pst) {
      case "PAID":
        return <Badge className="bg-emerald-600 text-white text-[11px]">Paid</Badge>;
      case "PARTIAL":
        return <Badge className="bg-amber-500 text-white text-[11px]">Partial Advance</Badge>;
      case "CREDIT":
        return <Badge className="bg-blue-600 text-white text-[11px]">Credit</Badge>;
      default:
        return <Badge variant="outline" className="text-amber-600 border-amber-300 text-[11px]">Pending</Badge>;
    }
  };

  const grossProfit =
    booking.quotedAmount && booking.driverPayoutAmount
      ? booking.quotedAmount - booking.driverPayoutAmount
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-black font-mono tracking-tight">
                  {booking.bookingNumber}
                </SheetTitle>
                {getStatusBadge(booking.status)}
                {getPaymentBadge(booking.paymentStatus)}
              </div>
              <p className="text-xs text-muted-foreground">
                Source: <span className="font-semibold text-foreground">{booking.source || "ADMIN_MANUAL"}</span> • Recorded on{" "}
                {new Date(booking.createdAt).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Copy Trip Sheet"
                onClick={copyTripSheet}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Edit Booking"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(booking);
                }}
              >
                <Edit2 className="h-4 w-4 text-primary" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                title="Delete Booking"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Status Control Bar */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                Quick Status:
              </span>
              <Select value={booking.status || "INQUIRY"} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-7 text-xs bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INQUIRY" className="text-xs">Inquiry</SelectItem>
                  <SelectItem value="QUOTED" className="text-xs">Quoted</SelectItem>
                  <SelectItem value="CONFIRMED" className="text-xs">Confirmed</SelectItem>
                  <SelectItem value="TRUCK_ASSIGNED" className="text-xs">Truck Assigned</SelectItem>
                  <SelectItem value="LOADING" className="text-xs">Loading</SelectItem>
                  <SelectItem value="IN_TRANSIT" className="text-xs">In Transit</SelectItem>
                  <SelectItem value="UNLOADED" className="text-xs">Unloaded</SelectItem>
                  <SelectItem value="DELIVERED" className="text-xs">Delivered</SelectItem>
                  <SelectItem value="COMPLETED" className="text-xs">Completed</SelectItem>
                  <SelectItem value="CANCELLED" className="text-xs">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                Payment:
              </span>
              <Select value={booking.paymentStatus || "PENDING"} onValueChange={handlePaymentStatusChange}>
                <SelectTrigger className="h-7 text-xs bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
                  <SelectItem value="PARTIAL" className="text-xs">Partial Advance</SelectItem>
                  <SelectItem value="PAID" className="text-xs">Fully Paid</SelectItem>
                  <SelectItem value="CREDIT" className="text-xs">Credit</SelectItem>
                  <SelectItem value="CANCELLED" className="text-xs">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SheetHeader>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Commercial Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Quoted Fare</div>
              <div className="text-lg font-black text-primary mt-0.5">
                ₹{booking.quotedAmount?.toLocaleString("en-IN") || "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Driver Payout</div>
              <div className="text-lg font-black text-sky-700 dark:text-sky-400 mt-0.5">
                ₹{booking.driverPayoutAmount?.toLocaleString("en-IN") || "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Advance Recd.</div>
              <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                ₹{booking.advanceReceived?.toLocaleString("en-IN") || "0"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Balance Due</div>
              <div className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5">
                ₹{booking.balanceAmount?.toLocaleString("en-IN") || "—"}
              </div>
            </div>
          </div>

          {/* Section 2: Route & Transit */}
          <div className="p-4 bg-muted/30 rounded-2xl border space-y-4">
            <h4 className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> Route & Transit Details</span>
              {booking.estimatedDistanceKm && (
                <span className="text-[11px] font-mono font-semibold bg-muted px-2 py-0.5 rounded-full">
                  {booking.estimatedDistanceKm} km
                </span>
              )}
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {/* Pickup Point */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold">
                  P
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground">
                    {booking.pickupCity || "Pickup Location"}{booking.pickupState ? `, ${booking.pickupState}` : ""}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {booking.pickupAddress || "Address not provided"} {booking.pickupPincode ? `(${booking.pickupPincode})` : ""}
                  </div>
                  {booking.pickupDateTime && (
                    <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" /> {new Date(booking.pickupDateTime).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              </div>

              {/* Drop-off Point */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-white text-[9px] font-bold">
                  D
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground">
                    {booking.dropoffCity || "Drop-off Location"}{booking.dropoffState ? `, ${booking.dropoffState}` : ""}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {booking.dropoffAddress || "Address not provided"} {booking.dropoffPincode ? `(${booking.dropoffPincode})` : ""}
                  </div>
                  {booking.dropoffDateTime && (
                    <div className="text-[10px] font-medium text-sky-700 dark:text-sky-400 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" /> {new Date(booking.dropoffDateTime).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {booking.routeDescription && (
              <div className="text-[11px] text-muted-foreground bg-muted/50 p-2.5 rounded-lg border">
                <span className="font-semibold text-foreground">Route Notes:</span> {booking.routeDescription}
              </div>
            )}
          </div>

          {/* Section 3: Customer & Receiver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-2xl border space-y-2.5">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" /> Shipper Details
              </h4>
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-foreground">{booking.customerName || "—"}</div>
                {booking.customerPhone && (
                  <div className="text-muted-foreground font-mono flex items-center gap-1">
                    <Phone className="h-3 w-3 text-primary" /> {booking.customerPhone}
                  </div>
                )}
                {booking.customerCompany && (
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Building className="h-3 w-3" /> {booking.customerCompany}
                  </div>
                )}
                {booking.customerGstin && (
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">
                    GSTIN: {booking.customerGstin}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl border space-y-2.5">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Building className="h-4 w-4 text-primary" /> Receiver / Consignee
              </h4>
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-foreground">{booking.receiverName || "—"}</div>
                {booking.receiverPhone && (
                  <div className="text-muted-foreground font-mono flex items-center gap-1">
                    <Phone className="h-3 w-3 text-sky-600" /> {booking.receiverPhone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Vehicle & Driver Assignment */}
          <div className="p-4 bg-muted/30 rounded-2xl border space-y-3">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary" /> Vehicle & Driver Assignment
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">Vehicle Type</span>
                <span className="font-semibold text-foreground font-mono">
                  {booking.vehicleType ? booking.vehicleType.replace(/_/g, " ") : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Vehicle Reg No.</span>
                <span className="font-bold text-foreground font-mono uppercase">
                  {booking.vehicleNumber || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Body Type / Trucks</span>
                <span className="font-semibold text-foreground">
                  {booking.bodyType || "Open"} • {booking.truckCount || 1} Truck(s)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Driver Name</span>
                <span className="font-semibold text-foreground">{booking.driverName || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Driver Phone</span>
                <span className="font-mono text-foreground">{booking.driverPhone || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Transporter</span>
                <span className="font-semibold text-foreground">{booking.transporterName || "—"}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Goods & Cargo Declaration */}
          <div className="p-4 bg-muted/30 rounded-2xl border space-y-3">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Package className="h-4 w-4 text-primary" /> Goods & Cargo Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">Category</span>
                <span className="font-semibold text-foreground">{booking.goodsType || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Weight</span>
                <span className="font-semibold text-foreground">
                  {booking.goodsWeightTons ? `${booking.goodsWeightTons} Tons` : booking.goodsWeightKg ? `${booking.goodsWeightKg} Kg` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Quantity / Packages</span>
                <span className="font-semibold text-foreground">{booking.goodsQuantity || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Declared Value</span>
                <span className="font-semibold text-foreground">
                  {booking.goodsDeclaredValue ? `₹${booking.goodsDeclaredValue.toLocaleString("en-IN")}` : "—"}
                </span>
              </div>
            </div>
            {booking.goodsDescription && (
              <div className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Description:</span> {booking.goodsDescription}
              </div>
            )}
            {booking.handlingInstructions && (
              <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800/40">
                <span className="font-semibold">Handling Note:</span> {booking.handlingInstructions}
              </div>
            )}
          </div>

          {/* Section 6: Internal Notes */}
          {booking.notes && (
            <div className="p-4 bg-muted/30 rounded-2xl border space-y-1.5">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Internal Remarks & Logs
              </h4>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
