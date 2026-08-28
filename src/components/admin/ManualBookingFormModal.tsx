import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Building,
  FileText,
  Loader2,
} from "lucide-react";
import { useCreateManualBooking, useUpdateManualBooking } from "@/hooks/useManualBookings";
import type { ManualBookingRecord } from "@/lib/api/manual-bookings.api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: ManualBookingRecord | null;
}

const VEHICLE_OPTIONS = [
  { value: "TATA_ACE", label: "Tata Ace / Chota Hathi" },
  { value: "BOLERO_PICKUP", label: "Bolero Pickup" },
  { value: "MINI_TRUCK", label: "Mini Truck (8ft / 9ft)" },
  { value: "TRUCK_14FT", label: "14ft Eicher / Tempo" },
  { value: "TRUCK_17FT", label: "17ft Eicher / Taurus" },
  { value: "TRUCK_19FT", label: "19ft ICV / Medium Truck" },
  { value: "TRUCK_20FT", label: "20ft Heavy Truck" },
  { value: "CONTAINER_32FT", label: "32ft Multi-Axle Container" },
  { value: "TRAILER_40FT", label: "40ft Flat-Bed / Trailer" },
  { value: "OPEN_BODY_TRUCK", label: "Open Body Heavy Truck" },
  { value: "THREE_WHEELER", label: "3-Wheeler Auto" },
  { value: "OTHER", label: "Other / Custom Vehicle" },
];

const GOODS_OPTIONS = [
  "Industrial Goods",
  "FMCG & Groceries",
  "Agriculture & Produce",
  "Machinery & Heavy Equipment",
  "Electronics & Appliances",
  "Construction Materials",
  "Chemicals & Liquids",
  "Household Goods & Shifting",
  "Textiles & Garments",
  "Auto Parts & Hardware",
  "Packaging Materials",
  "General Cargo",
  "Other",
];

const SOURCE_OPTIONS = [
  { value: "PHONE_CALL", label: "Phone Call (Direct)" },
  { value: "WHATSAPP", label: "WhatsApp Inquiry" },
  { value: "WALK_IN", label: "Walk-in Customer" },
  { value: "BROKER", label: "Broker / Agent" },
  { value: "TRANSPORTER_EXTERNAL", label: "External Transporter" },
  { value: "ADMIN_MANUAL", label: "Super Admin Manual" },
];

const STATUS_OPTIONS = [
  { value: "INQUIRY", label: "Inquiry (Pending Quote)" },
  { value: "QUOTED", label: "Quoted" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "TRUCK_ASSIGNED", label: "Truck Assigned" },
  { value: "LOADING", label: "Loading at Pickup" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "UNLOADED", label: "Unloaded" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "COMPLETED", label: "Completed & Settled" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PARTIAL", label: "Partial Advance Received" },
  { value: "PAID", label: "Fully Paid" },
  { value: "CREDIT", label: "Credit (Post-delivery)" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function ManualBookingFormModal({ open, onOpenChange, booking }: Props) {
  const isEditing = !!booking;
  const createMut = useCreateManualBooking();
  const updateMut = useUpdateManualBooking();

  const [activeTab, setActiveTab] = useState<"customer" | "route" | "vehicle" | "goods" | "financials">("customer");

  const [form, setForm] = useState<Partial<ManualBookingRecord>>({
    bookingNumber: "",
    source: "PHONE_CALL",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerCompany: "",
    customerGstin: "",
    receiverName: "",
    receiverPhone: "",
    pickupAddress: "",
    pickupCity: "",
    pickupDistrict: "",
    pickupState: "West Bengal",
    pickupPincode: "",
    pickupLandmark: "",
    pickupDateTime: "",
    dropoffAddress: "",
    dropoffCity: "",
    dropoffDistrict: "",
    dropoffState: "West Bengal",
    dropoffPincode: "",
    dropoffLandmark: "",
    dropoffDateTime: "",
    estimatedDistanceKm: undefined,
    routeDescription: "",
    vehicleType: "TATA_ACE",
    vehicleNumber: "",
    truckCount: 1,
    bodyType: "OPEN",
    driverName: "",
    driverPhone: "",
    driverDlNumber: "",
    transporterName: "",
    transporterPhone: "",
    goodsType: "General Cargo",
    goodsDescription: "",
    goodsWeightKg: undefined,
    goodsWeightTons: undefined,
    goodsQuantity: undefined,
    goodsDeclaredValue: undefined,
    handlingInstructions: "",
    quotedAmount: undefined,
    driverPayoutAmount: undefined,
    advanceReceived: 0,
    balanceAmount: undefined,
    paymentStatus: "PENDING",
    paymentMode: "CASH",
    invoiceNumber: "",
    status: "INQUIRY",
    notes: "",
  });

  useEffect(() => {
    if (booking) {
      setForm({
        ...booking,
        pickupDateTime: booking.pickupDateTime ? new Date(booking.pickupDateTime).toISOString().slice(0, 16) : "",
        dropoffDateTime: booking.dropoffDateTime ? new Date(booking.dropoffDateTime).toISOString().slice(0, 16) : "",
      });
    } else {
      setForm({
        bookingNumber: "",
        source: "PHONE_CALL",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerCompany: "",
        customerGstin: "",
        receiverName: "",
        receiverPhone: "",
        pickupAddress: "",
        pickupCity: "",
        pickupDistrict: "",
        pickupState: "West Bengal",
        pickupPincode: "",
        pickupLandmark: "",
        pickupDateTime: "",
        dropoffAddress: "",
        dropoffCity: "",
        dropoffDistrict: "",
        dropoffState: "West Bengal",
        dropoffPincode: "",
        dropoffLandmark: "",
        dropoffDateTime: "",
        estimatedDistanceKm: undefined,
        routeDescription: "",
        vehicleType: "TATA_ACE",
        vehicleNumber: "",
        truckCount: 1,
        bodyType: "OPEN",
        driverName: "",
        driverPhone: "",
        driverDlNumber: "",
        transporterName: "",
        transporterPhone: "",
        goodsType: "General Cargo",
        goodsDescription: "",
        goodsWeightKg: undefined,
        goodsWeightTons: undefined,
        goodsQuantity: undefined,
        goodsDeclaredValue: undefined,
        handlingInstructions: "",
        quotedAmount: undefined,
        driverPayoutAmount: undefined,
        advanceReceived: 0,
        balanceAmount: undefined,
        paymentStatus: "PENDING",
        paymentMode: "CASH",
        invoiceNumber: "",
        status: "INQUIRY",
        notes: "",
      });
      setActiveTab("customer");
    }
  }, [booking, open]);

  const handleAmountChange = (field: "quotedAmount" | "advanceReceived", val: string) => {
    const num = parseFloat(val) || 0;
    const nextForm = { ...form, [field]: val === "" ? undefined : num };
    const q = field === "quotedAmount" ? num : form.quotedAmount || 0;
    const a = field === "advanceReceived" ? num : form.advanceReceived || 0;
    if (q > 0) {
      nextForm.balanceAmount = Math.max(0, q - a);
      if (a >= q) nextForm.paymentStatus = "PAID";
      else if (a > 0) nextForm.paymentStatus = "PARTIAL";
    }
    setForm(nextForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && booking?.id) {
        await updateMut.mutateAsync({ id: booking.id, data: form });
      } else {
        await createMut.mutateAsync(form);
      }
      onOpenChange(false);
    } catch {
      // Handled by mutation toast
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                {isEditing ? `Edit Manual Booking (${booking?.bookingNumber})` : "Create Offline / Manual Truck Booking"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                All fields are optional. Enter any available details for offline or external loads.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 pt-4 overflow-x-auto no-scrollbar border-t border-slate-100 mt-3">
            {[
              { id: "customer", label: "1. Customer & Source", icon: User },
              { id: "route", label: "2. Pickup & Drop-off", icon: MapPin },
              { id: "vehicle", label: "3. Truck & Driver", icon: Truck },
              { id: "goods", label: "4. Goods & Load", icon: Package },
              { id: "financials", label: "5. Fare & Status", icon: BadgeIndianRupee },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "customer" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Booking / Inquiry Source</Label>
                  <Select
                    value={form.source || "PHONE_CALL"}
                    onValueChange={(v) => setForm({ ...form, source: v })}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Custom Booking # (Optional)</Label>
                  <Input
                    placeholder="e.g. MNL-20260828-4921 (auto-generated if empty)"
                    value={form.bookingNumber || ""}
                    onChange={(e) => setForm({ ...form, bookingNumber: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary" /> Shipper / Customer Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Customer Name</Label>
                    <Input
                      placeholder="e.g. Rahul Sen"
                      value={form.customerName || ""}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Phone Number</Label>
                    <Input
                      placeholder="e.g. 9876543210"
                      value={form.customerPhone || ""}
                      onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Email Address</Label>
                    <Input
                      placeholder="e.g. customer@example.com"
                      value={form.customerEmail || ""}
                      onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Company / Business Name</Label>
                    <Input
                      placeholder="e.g. Sen Logistics Ltd."
                      value={form.customerCompany || ""}
                      onChange={(e) => setForm({ ...form, customerCompany: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">GSTIN Number</Label>
                    <Input
                      placeholder="e.g. 19AAAAA0000A1Z5"
                      value={form.customerGstin || ""}
                      onChange={(e) => setForm({ ...form, customerGstin: e.target.value })}
                      className="h-8 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-primary" /> Receiver / Consignee Details (Optional)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Receiver Name</Label>
                    <Input
                      placeholder="e.g. Amit Ghosh"
                      value={form.receiverName || ""}
                      onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Receiver Phone</Label>
                    <Input
                      placeholder="e.g. 9830000000"
                      value={form.receiverPhone || ""}
                      onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "route" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-600" /> Pickup Location Details
                  </h4>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Pickup Address / Hub</Label>
                      <Input
                        placeholder="Street, warehouse name, plot no."
                        value={form.pickupAddress || ""}
                        onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">City</Label>
                        <Input
                          placeholder="e.g. Kolkata"
                          value={form.pickupCity || ""}
                          onChange={(e) => setForm({ ...form, pickupCity: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">District</Label>
                        <Input
                          placeholder="e.g. North 24 Parganas"
                          value={form.pickupDistrict || ""}
                          onChange={(e) => setForm({ ...form, pickupDistrict: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">State</Label>
                        <Input
                          placeholder="e.g. West Bengal"
                          value={form.pickupState || ""}
                          onChange={(e) => setForm({ ...form, pickupState: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Pincode</Label>
                        <Input
                          placeholder="e.g. 700001"
                          value={form.pickupPincode || ""}
                          onChange={(e) => setForm({ ...form, pickupPincode: e.target.value })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Pickup Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={form.pickupDateTime || ""}
                        onChange={(e) => setForm({ ...form, pickupDateTime: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl border border-sky-200/60 dark:border-sky-800/40 space-y-3">
                  <h4 className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-sky-600" /> Drop-off / Delivery Details
                  </h4>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Drop-off Address</Label>
                      <Input
                        placeholder="Street, factory name, store."
                        value={form.dropoffAddress || ""}
                        onChange={(e) => setForm({ ...form, dropoffAddress: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">City</Label>
                        <Input
                          placeholder="e.g. Siliguri"
                          value={form.dropoffCity || ""}
                          onChange={(e) => setForm({ ...form, dropoffCity: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">District</Label>
                        <Input
                          placeholder="e.g. Darjeeling"
                          value={form.dropoffDistrict || ""}
                          onChange={(e) => setForm({ ...form, dropoffDistrict: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">State</Label>
                        <Input
                          placeholder="e.g. West Bengal"
                          value={form.dropoffState || ""}
                          onChange={(e) => setForm({ ...form, dropoffState: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Pincode</Label>
                        <Input
                          placeholder="e.g. 734001"
                          value={form.dropoffPincode || ""}
                          onChange={(e) => setForm({ ...form, dropoffPincode: e.target.value })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Delivery Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={form.dropoffDateTime || ""}
                        onChange={(e) => setForm({ ...form, dropoffDateTime: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Estimated Distance (km)</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 580"
                    value={form.estimatedDistanceKm ?? ""}
                    onChange={(e) => setForm({ ...form, estimatedDistanceKm: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Route / Highway Description</Label>
                  <Input
                    placeholder="e.g. NH-12 via Malda - Dalkhola"
                    value={form.routeDescription || ""}
                    onChange={(e) => setForm({ ...form, routeDescription: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "vehicle" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-primary" /> Truck & Fleet Configuration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Vehicle Type</Label>
                    <Select
                      value={form.vehicleType || "TATA_ACE"}
                      onValueChange={(v) => setForm({ ...form, vehicleType: v })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VEHICLE_OPTIONS.map((vo) => (
                          <SelectItem key={vo.value} value={vo.value} className="text-xs">{vo.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Body Type</Label>
                    <Select
                      value={form.bodyType || "OPEN"}
                      onValueChange={(v) => setForm({ ...form, bodyType: v })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN" className="text-xs">Open Body</SelectItem>
                        <SelectItem value="CLOSED_CONTAINER" className="text-xs">Closed Container</SelectItem>
                        <SelectItem value="TARPAULIN" className="text-xs">Tarpaulin Covered</SelectItem>
                        <SelectItem value="HIGH_BED" className="text-xs">High Bed Trailer</SelectItem>
                        <SelectItem value="FLAT_BED" className="text-xs">Flat Bed Trailer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Trucks Needed</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.truckCount || 1}
                      onChange={(e) => setForm({ ...form, truckCount: parseInt(e.target.value) || 1 })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Vehicle Reg Number</Label>
                    <Input
                      placeholder="e.g. WB25B1234"
                      value={form.vehicleNumber || ""}
                      onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
                      className="h-8 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary" /> Driver & Transporter Assignment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Driver Name</Label>
                    <Input
                      placeholder="e.g. Ramesh Kumar"
                      value={form.driverName || ""}
                      onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Driver Phone</Label>
                    <Input
                      placeholder="e.g. 9811122233"
                      value={form.driverPhone || ""}
                      onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Driver DL Number</Label>
                    <Input
                      placeholder="e.g. WB01-20180001234"
                      value={form.driverDlNumber || ""}
                      onChange={(e) => setForm({ ...form, driverDlNumber: e.target.value })}
                      className="h-8 text-xs font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Transporter / Fleet Owner</Label>
                    <Input
                      placeholder="e.g. Bengal Roadways"
                      value={form.transporterName || ""}
                      onChange={(e) => setForm({ ...form, transporterName: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Transporter Phone</Label>
                    <Input
                      placeholder="e.g. 9831098310"
                      value={form.transporterPhone || ""}
                      onChange={(e) => setForm({ ...form, transporterPhone: e.target.value })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "goods" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-primary" /> Goods & Material Declaration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Goods / Material Category</Label>
                    <Select
                      value={form.goodsType || "General Cargo"}
                      onValueChange={(v) => setForm({ ...form, goodsType: v })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GOODS_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px] text-muted-foreground">Goods Description</Label>
                    <Input
                      placeholder="e.g. 120 Cartons of Electric Ceiling Fans"
                      value={form.goodsDescription || ""}
                      onChange={(e) => setForm({ ...form, goodsDescription: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Weight (Tons)</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 4.5"
                      value={form.goodsWeightTons ?? ""}
                      onChange={(e) => {
                        const t = e.target.value ? parseFloat(e.target.value) : undefined;
                        setForm({
                          ...form,
                          goodsWeightTons: t,
                          goodsWeightKg: t !== undefined ? t * 1000 : undefined,
                        });
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Weight (Kg)</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 4500"
                      value={form.goodsWeightKg ?? ""}
                      onChange={(e) => {
                        const kg = e.target.value ? parseFloat(e.target.value) : undefined;
                        setForm({
                          ...form,
                          goodsWeightKg: kg,
                          goodsWeightTons: kg !== undefined ? kg / 1000 : undefined,
                        });
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Quantity / Packages</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 120"
                      value={form.goodsQuantity ?? ""}
                      onChange={(e) => setForm({ ...form, goodsQuantity: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Declared Value (₹)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 350000"
                      value={form.goodsDeclaredValue ?? ""}
                      onChange={(e) => setForm({ ...form, goodsDeclaredValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px] text-muted-foreground">Handling Instructions</Label>
                    <Input
                      placeholder="e.g. Fragile glass items, keep upright, tarpaulin compulsory."
                      value={form.handlingInstructions || ""}
                      onChange={(e) => setForm({ ...form, handlingInstructions: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "financials" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BadgeIndianRupee className="h-4 w-4 text-primary" /> Commercials & Rates
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Quoted Customer Fare (₹)
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 18500"
                      value={form.quotedAmount ?? ""}
                      onChange={(e) => handleAmountChange("quotedAmount", e.target.value)}
                      className="h-8 text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                      Driver / Vendor Payout (₹)
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 15000"
                      value={form.driverPayoutAmount ?? ""}
                      onChange={(e) => setForm({ ...form, driverPayoutAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="h-8 text-xs font-mono text-sky-700 dark:text-sky-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Advance Received (₹)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 5000"
                      value={form.advanceReceived ?? 0}
                      onChange={(e) => handleAmountChange("advanceReceived", e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Balance Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="Auto calculated"
                      value={form.balanceAmount ?? ""}
                      onChange={(e) => setForm({ ...form, balanceAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="h-8 text-xs font-mono bg-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" /> Operational & Payment Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Booking Status</Label>
                    <Select
                      value={form.status || "INQUIRY"}
                      onValueChange={(v) => setForm({ ...form, status: v })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((st) => (
                          <SelectItem key={st.value} value={st.value} className="text-xs">{st.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Payment Status</Label>
                    <Select
                      value={form.paymentStatus || "PENDING"}
                      onValueChange={(v) => setForm({ ...form, paymentStatus: v })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUS_OPTIONS.map((pso) => (
                          <SelectItem key={pso.value} value={pso.value} className="text-xs">{pso.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Payment Mode</Label>
                    <Select
                      value={form.paymentMode || "CASH"}
                      onValueChange={(v) => setForm({ ...form, paymentMode: v })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH" className="text-xs">Cash</SelectItem>
                        <SelectItem value="UPI" className="text-xs">UPI / QR</SelectItem>
                        <SelectItem value="BANK_TRANSFER" className="text-xs">NEFT / RTGS</SelectItem>
                        <SelectItem value="CHEQUE" className="text-xs">Cheque</SelectItem>
                        <SelectItem value="CREDIT_15_DAYS" className="text-xs">Credit (15 Days)</SelectItem>
                        <SelectItem value="CREDIT_30_DAYS" className="text-xs">Credit (30 Days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Invoice / Bill Number</Label>
                    <Input
                      placeholder="e.g. INV-2026-081"
                      value={form.invoiceNumber || ""}
                      onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Internal Notes & Operations Log</Label>
                  <Textarea
                    placeholder="Add any special broker instructions, toll reimbursement terms, loading remarks..."
                    value={form.notes || ""}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="text-xs min-h-[70px]"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeTab !== "customer" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tabs: ("customer" | "route" | "vehicle" | "goods" | "financials")[] = [
                      "customer", "route", "vehicle", "goods", "financials"
                    ];
                    const idx = tabs.indexOf(activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1]);
                  }}
                  className="text-xs"
                >
                  Previous Step
                </Button>
              )}
              {activeTab !== "financials" && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const tabs: ("customer" | "route" | "vehicle" | "goods" | "financials")[] = [
                      "customer", "route", "vehicle", "goods", "financials"
                    ];
                    const idx = tabs.indexOf(activeTab);
                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
                  }}
                  className="text-xs"
                >
                  Next Step
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="text-xs font-semibold gap-1.5"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Manual Booking"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
