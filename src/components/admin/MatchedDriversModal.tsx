import { useState, useMemo, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Truck,
  MapPin,
  Phone,
  MessageSquare,
  Eye,
  CheckCircle2,
  Search,
  Filter,
  Navigation,
  Compass,
  Copy,
  ExternalLink,
  Building2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useMatchedDrivers, useUpdateManualBooking } from "@/hooks/useManualBookings";
import { useDebounce } from "@/hooks/useDebounce";
import type { ManualBookingRecord, MatchedDriverLead } from "@/lib/api/manual-bookings.api";
import { toast } from "sonner";

interface MatchedDriversModalProps {
  booking: ManualBookingRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDriverAssigned?: (booking: ManualBookingRecord) => void;
}

const RADIUS_OPTIONS = [
  { value: "25", label: "≤ 25 km (Local Hub only)" },
  { value: "50", label: "≤ 50 km (Matched Area - Default)" },
  { value: "100", label: "≤ 100 km (Regional Corridor)" },
  { value: "200", label: "≤ 200 km (Statewide)" },
  { value: "ALL", label: "Pan-India (All Drivers)" },
];

export function MatchedDriversModal({
  booking,
  open,
  onOpenChange,
  onDriverAssigned,
}: MatchedDriversModalProps) {
  // Default to 50 km matched area
  const [radiusFilter, setRadiusFilter] = useState("50");
  const [vehicleFilter, setVehicleFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Sync filters whenever booking changes or modal opens
  useEffect(() => {
    if (booking && open) {
      setRadiusFilter("50");
      setVehicleFilter(booking.vehicleType || "ALL");
      setSearchTerm("");
    }
  }, [booking?.id, open]);

  const queryParams = useMemo(() => {
    return {
      radiusKm: radiusFilter !== "ALL" ? Number(radiusFilter) : undefined,
      vehicleType: vehicleFilter !== "ALL" ? vehicleFilter : undefined,
      search: debouncedSearch || undefined,
    };
  }, [radiusFilter, vehicleFilter, debouncedSearch]);

  const { data, isLoading } = useMatchedDrivers(
    open && booking?.id ? booking.id : null,
    queryParams
  );

  const updateBookingMut = useUpdateManualBooking();

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast.success(`Copied phone: ${phone}`);
  };

  const handleAssignDriver = (driver: MatchedDriverLead) => {
    if (!booking?.id) return;
    updateBookingMut.mutate(
      {
        id: booking.id,
        data: {
          driverName: driver.name,
          driverPhone: driver.phone,
          vehicleNumber: driver.vehicleNumber,
          vehicleType: driver.vehicleType,
          status: "TRUCK_ASSIGNED",
        },
      },
      {
        onSuccess: (updated) => {
          toast.success(`Assigned driver ${driver.name} to booking ${booking.bookingNumber}!`);
          if (onDriverAssigned) onDriverAssigned(updated);
          onOpenChange(false);
        },
      }
    );
  };

  const fmtVehicle = (v: string) => {
    if (!v) return "Mini Truck";
    return v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getTierBadge = (tier: string, distanceKm: number) => {
    switch (tier) {
      case "LOCAL":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            📍 {distanceKm} km (Local Hub)
          </Badge>
        );
      case "REGIONAL":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            📍 {distanceKm} km (Regional Corridor)
          </Badge>
        );
      case "CORRIDOR":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            📍 {distanceKm} km (Corridor)
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            📍 {distanceKm} km (Extended)
          </Badge>
        );
    }
  };

  if (!booking) return null;

  const driversList = data?.drivers || [];
  const summary = data?.summary;
  const pickupCoords = data?.pickupCoords;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-slate-200 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    Live Matched Drivers for Load
                    <Badge className="bg-white/15 text-white border-white/20 text-xs font-mono">
                      {booking.bookingNumber}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-slate-300 text-xs flex items-center gap-1.5 mt-0.5">
                    <span className="font-semibold text-emerald-400 capitalize">
                      {booking.pickupCity || booking.pickupAddress || "Origin"}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-sky-400 capitalize">
                      {booking.dropoffCity || booking.dropoffAddress || "Destination"}
                    </span>
                    {booking.vehicleType && (
                      <span className="text-slate-400 ml-1">
                        • Req: <strong className="text-white">{fmtVehicle(booking.vehicleType)}</strong>
                      </span>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Quick Origin Coordinates Pill */}
            {pickupCoords && (
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-lg px-3 py-1.5 text-right self-start sm:self-auto shrink-0">
                <div className="text-[10px] text-slate-300 flex items-center gap-1 justify-end">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  Origin Center:
                </div>
                <div className="text-xs font-bold text-white">
                  {pickupCoords.resolvedLocationName}
                  <span className="text-[10px] font-mono text-slate-300 ml-1">
                    ({pickupCoords.lat.toFixed(3)}, {pickupCoords.lng.toFixed(3)})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10">
            <div className="bg-white/5 rounded-md px-2.5 py-1.5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase font-medium">
                {radiusFilter === "ALL" ? "Total Across India" : `Within ${radiusFilter} km`}
              </span>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                {summary?.totalMatched ?? "..."} Drivers
              </div>
            </div>
            <div className="bg-emerald-950/40 rounded-md px-2.5 py-1.5 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-300 uppercase font-medium">Local (≤ 25km)</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {summary?.localCount ?? "0"} Available
              </div>
            </div>
            <div className="bg-amber-950/40 rounded-md px-2.5 py-1.5 border border-amber-500/30">
              <span className="text-[10px] text-amber-300 uppercase font-medium">Regional (25-60km)</span>
              <div className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {summary?.regionalCount ?? "0"} Available
              </div>
            </div>
            <div className="bg-blue-950/40 rounded-md px-2.5 py-1.5 border border-blue-500/30">
              <span className="text-[10px] text-blue-300 uppercase font-medium">Corridor (&gt; 60km)</span>
              <div className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {(summary?.corridorCount || 0) + (summary?.extendedCount || 0)} Available
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Controls Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <Input
                placeholder="Search driver by name, phone, hub, vehicle, or route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-8 text-xs bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Radius Selector */}
            <Select value={radiusFilter} onValueChange={setRadiusFilter}>
              <SelectTrigger className="h-9 text-xs w-[185px] bg-white font-medium">
                <Compass className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                <SelectValue placeholder="Radius" />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Vehicle Selector */}
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="h-9 text-xs w-[165px] bg-white font-medium">
                <Filter className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs font-semibold">
                  All Vehicles
                </SelectItem>
                {booking.vehicleType && (
                  <SelectItem
                    value={booking.vehicleType}
                    className="text-xs font-semibold text-emerald-700 bg-emerald-50"
                  >
                    Exact Match ({fmtVehicle(booking.vehicleType)})
                  </SelectItem>
                )}
                <SelectItem value="TATA_ACE" className="text-xs">
                  Tata Ace (Mini Truck)
                </SelectItem>
                <SelectItem value="BOLERO_PICKUP" className="text-xs">
                  Bolero Pickup
                </SelectItem>
                <SelectItem value="TRUCK_14FT" className="text-xs">
                  14ft Eicher / Canter
                </SelectItem>
                <SelectItem value="TRUCK_17FT" className="text-xs">
                  17ft Eicher
                </SelectItem>
                <SelectItem value="TRUCK_19FT" className="text-xs">
                  19ft ICV
                </SelectItem>
                <SelectItem value="TRUCK_20FT" className="text-xs">
                  20ft / 24ft Truck
                </SelectItem>
                <SelectItem value="CONTAINER_32FT" className="text-xs">
                  32ft Container / Heavy
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Driver Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[350px] bg-slate-100/60">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-72" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-28 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : driversList.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3 my-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Navigation className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  No drivers matched within {radiusFilter === "ALL" ? "current filters" : `${radiusFilter} km radius`}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Expand the radius (e.g. 50 km or 100 km) or switch vehicle filter to discover trucks in neighbouring districts willing to take the load.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold"
                onClick={() => {
                  setRadiusFilter("100");
                  setVehicleFilter("ALL");
                  setSearchTerm("");
                }}
              >
                Expand Radius to 100 km & Show All Vehicles
              </Button>
            </div>
          ) : (
            driversList.map((driver) => {
              const isAssigned =
                booking.driverPhone === driver.phone ||
                booking.driverName?.toLowerCase() === driver.name.toLowerCase();

              const cleanPhone = driver.phone.replace(/\D/g, "");
              const whatsappUrl = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
                `Hello ${driver.name}, we have a load from ${booking.pickupCity || "origin"} to ${
                  booking.dropoffCity || "destination"
                } requiring ${fmtVehicle(booking.vehicleType || "truck")}. Please let us know if available.`
              )}`;

              return (
                <div
                  key={driver.id}
                  className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md p-4 space-y-3 ${
                    isAssigned
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20"
                      : driver.isExactVehicleMatch
                      ? "border-emerald-200 hover:border-emerald-300"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{driver.name}</span>
                        {getTierBadge(driver.tier, driver.distanceKm)}
                        {driver.isExactVehicleMatch && (
                          <Badge className="bg-emerald-600 text-white font-medium text-[10px] px-1.5 py-0">
                            Exact Vehicle Match
                          </Badge>
                        )}
                        {isAssigned && (
                          <Badge className="bg-indigo-600 text-white font-semibold text-[10px]">
                            Currently Assigned
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-indigo-600" />
                          {fmtVehicle(driver.vehicleType)}
                        </span>
                        {driver.vehicleNumber && !driver.vehicleNumber.startsWith("SEED-") && (
                          <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            {driver.vehicleNumber}
                          </span>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {driver.transportHub || driver.city}
                          {driver.state ? `, ${driver.state}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Proximity Match Score */}
                    <div className="flex items-center sm:flex-col items-end gap-1 shrink-0">
                      <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        {driver.matchScore}% Match Score
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Lead: {driver.leadId}
                      </div>
                    </div>
                  </div>

                  {/* Operational Notes / Route */}
                  {driver.notes && (
                    <div className="bg-slate-50 rounded-lg p-2.5 text-[11px] text-slate-600 border border-slate-200/70 line-clamp-2">
                      <span className="font-semibold text-slate-700">Route & Notes: </span>
                      {driver.notes.replace(/\[.*?\]:\s*/g, " • ").trim()}
                    </div>
                  )}

                  {/* Actions & Contacts Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {/* Call Action */}
                      <a href={`tel:${cleanPhone}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 font-medium"
                        >
                          <Phone className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          {driver.phone}
                        </Button>
                      </a>

                      {/* Copy Phone */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-slate-800"
                        title="Copy Phone Number"
                        onClick={() => handleCopyPhone(driver.phone)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>

                      {/* WhatsApp Action */}
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-green-700 border-green-300 bg-green-50 hover:bg-green-100 font-medium"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1 text-green-600" />
                          WhatsApp
                        </Button>
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* View Descriptive Profile Link */}
                      <Link
                        to="/platform/form-driver-leads/$id"
                        params={{ id: driver.id }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium"
                          title="Open Descriptive Driver Details Page"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View Driver Details
                          <ExternalLink className="w-3 h-3 ml-1 text-blue-400" />
                        </Button>
                      </Link>

                      {/* Assign Driver to Booking */}
                      <Button
                        size="sm"
                        className={`h-8 text-xs font-semibold ${
                          isAssigned
                            ? "bg-slate-200 text-slate-600 cursor-not-allowed hover:bg-slate-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        }`}
                        disabled={isAssigned || updateBookingMut.isPending}
                        onClick={() => handleAssignDriver(driver)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        {isAssigned ? "Assigned" : "Assign to Load"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Showing <strong className="text-slate-800">{driversList.length}</strong> matched drivers
            for this load ({radiusFilter === "ALL" ? "Pan-India" : `within ${radiusFilter} km`})
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
