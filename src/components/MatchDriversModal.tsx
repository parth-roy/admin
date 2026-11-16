import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Star,
  Copy,
  ShieldCheck,
  Check,
  Loader2,
  Sparkles,
  Navigation,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { bookingsApi } from "@/lib/api/bookings.api";
import { useAssignDriver } from "@/hooks/useBookings";
import type { MatchedOnboardedDriver } from "@/lib/api/types";

interface MatchDriversModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingNumber: string;
  pickupAddress?: string;
  vehicleType?: string;
  assignedDriverId?: string | null;
  onAssignedSuccess?: () => void;
}

export const MatchDriversModal: React.FC<MatchDriversModalProps> = ({
  open,
  onOpenChange,
  bookingId,
  bookingNumber,
  pickupAddress,
  vehicleType,
  assignedDriverId,
  onAssignedSuccess,
}) => {
  const [search, setSearch] = useState("");
  const [radiusKm, setRadiusKm] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [vehicleFilter, setVehicleFilter] = useState("ALL");
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(null);

  const assignMut = useAssignDriver();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["matched-drivers", bookingId, radiusKm, statusFilter, vehicleFilter, search],
    queryFn: () =>
      bookingsApi.getMatchedDrivers(bookingId, {
        radiusKm: radiusKm !== "ALL" ? radiusKm : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        vehicleType: vehicleFilter !== "ALL" ? vehicleFilter : undefined,
        search: search.trim() || undefined,
      }),
    enabled: open && !!bookingId,
    staleTime: 15_000,
  });

  const drivers: MatchedOnboardedDriver[] = data?.drivers ?? [];

  const handleAssign = async (driver: MatchedOnboardedDriver) => {
    try {
      setAssigningDriverId(driver.driverId);
      await assignMut.mutateAsync({
        bookingId,
        driverId: driver.driverId,
      });
      toast.success(`Driver ${driver.name} successfully assigned to booking ${bookingNumber}!`);
      onOpenChange(false);
      onAssignedSuccess?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to assign driver. Please try again.");
    } finally {
      setAssigningDriverId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Match Onboarded Drivers for Booking
              </DialogTitle>
              <DialogDescription className="text-xs mt-1 text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Booking: <strong className="text-foreground">{bookingNumber}</strong>
                </span>
                <span>•</span>
                <span>
                  Pickup: <strong className="text-foreground">{pickupAddress || "Location"}</strong>
                </span>
                <span>•</span>
                <span>
                  Vehicle Needed:{" "}
                  <strong className="text-foreground uppercase">
                    {vehicleType?.replace(/_/g, " ") || "ANY"}
                  </strong>
                </span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-8 gap-1.5 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-3">
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search driver name, phone, vehicle reg, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 text-xs bg-background"
              />
            </div>

            {/* Radius Filter */}
            <Select value={radiusKm} onValueChange={setRadiusKm}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Proximity Radius" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Regions (All India)</SelectItem>
                <SelectItem value="50">Within 50 km (Local)</SelectItem>
                <SelectItem value="100">Within 100 km (Nearby)</SelectItem>
                <SelectItem value="250">Within 250 km (Regional)</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Driver Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="AVAILABLE">Available Only</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
                <SelectItem value="ON_TRIP">On Trip</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Analyzing and matching registered onboarded drivers against booking coordinates...
              </p>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm font-semibold text-destructive">Failed to load matched drivers</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : drivers.length === 0 ? (
            <div className="py-16 text-center space-y-2 border border-dashed rounded-lg bg-muted/10">
              <Truck className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No matching onboarded drivers found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try widening your proximity radius or clearing your search filters to view drivers from nearby districts.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => {
                  setSearch("");
                  setRadiusKm("ALL");
                  setStatusFilter("ALL");
                  setVehicleFilter("ALL");
                }}
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  Found <strong>{drivers.length}</strong> onboarded driver{drivers.length > 1 ? "s" : ""}{" "}
                  ranked by proximity, vehicle match & availability:
                </span>
                <span className="text-[11px]">Ranked #1 = Highest Match Score</span>
              </div>

              {drivers.map((d, index) => {
                const isAssigned = assignedDriverId === d.driverId || d.isCurrentlyAssigned;
                const isAssigningThis = assigningDriverId === d.driverId;

                return (
                  <div
                    key={d.driverId}
                    className={`rounded-xl border p-4 transition-all shadow-2xs ${
                      index === 0
                        ? "border-amber-400/60 bg-amber-50/20 dark:bg-amber-950/10 ring-1 ring-amber-400/30"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/10"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Driver Identity & Ratings */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                            #{index + 1}
                          </span>
                          <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
                            {d.name}
                          </h4>

                          {/* Verification Badge */}
                          {d.isDocVerified && (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1 py-0 h-5">
                              <ShieldCheck className="h-3 w-3" /> KYC Verified
                            </Badge>
                          )}

                          {/* Status Badge */}
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-semibold py-0 h-5 ${
                              d.status === "AVAILABLE"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                                : d.status === "ON_TRIP"
                                ? "bg-blue-500/10 text-blue-600 border-blue-300"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {d.status}
                          </Badge>

                          {/* Rating & Trips */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto md:ml-0">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            <span className="font-semibold text-foreground">{d.rating?.toFixed(1) || "5.0"}</span>
                            <span>({d.totalTrips || 0} trips)</span>
                          </div>
                        </div>

                        {/* Location & Distance Info */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 text-foreground font-medium">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>{d.locationName}</span>
                          </div>

                          {d.distanceKm !== null && (
                            <div className="flex items-center gap-1 font-semibold text-primary">
                              <Navigation className="h-3 w-3" />
                              <span>
                                {d.distanceKm === 0 ? "0 km (Exact Local RTO)" : `${d.distanceKm} km from Pickup`}
                              </span>
                            </div>
                          )}

                          {d.dlNumber && (
                            <div className="font-mono text-[11px] text-muted-foreground">
                              DL: <strong>{d.dlNumber}</strong>
                            </div>
                          )}
                        </div>

                        {/* Badges / Highlights */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {d.matchBadges.map((badge, bIdx) => (
                            <span
                              key={bIdx}
                              className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                badge.includes("Exact") || badge.includes("Local")
                                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 border border-amber-300/50 font-semibold"
                                  : badge.includes("Match")
                                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-300/50"
                                  : "bg-muted text-muted-foreground border"
                              }`}
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Middle: Vehicle Specs Card */}
                      <div className="bg-muted/30 border rounded-lg p-2.5 min-w-[200px] text-xs space-y-1">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                          Assigned Truck
                        </span>
                        {d.vehicle ? (
                          <>
                            <div className="font-mono font-bold text-sm text-foreground uppercase tracking-wide">
                              {d.vehicle.registrationNo}
                            </div>
                            <div className="text-muted-foreground font-medium">
                              {d.vehicle.type?.replace(/_/g, " ")}
                              {d.vehicle.model ? ` · ${d.vehicle.model}` : ""}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Capacity: <strong>{d.vehicle.capacityKg ? `${d.vehicle.capacityKg} kg` : "Standard"}</strong>
                              {d.vehicle.year ? ` · Year: ${d.vehicle.year}` : ""}
                            </div>
                          </>
                        ) : (
                          <div className="text-muted-foreground italic py-1">
                            No primary vehicle attached
                          </div>
                        )}
                      </div>

                      {/* Right: Phone & Action */}
                      <div className="flex md:flex-col items-center justify-between md:justify-center gap-2 min-w-[140px]">
                        {/* Phone Button */}
                        <div className="flex items-center gap-1">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-semibold gap-1 text-primary hover:text-primary"
                          >
                            <a href={`tel:${d.phone}`}>
                              <Phone className="h-3 w-3" /> {d.phone}
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => copyToClipboard(d.phone, "Phone number")}
                            title="Copy Phone"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Assign Button */}
                        {isAssigned ? (
                          <Badge className="bg-emerald-600 text-white gap-1 py-1 px-3 text-xs w-full justify-center">
                            <Check className="h-3.5 w-3.5" /> Currently Assigned
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full text-xs font-semibold gap-1.5"
                            onClick={() => handleAssign(d)}
                            disabled={isAssigningThis || assignMut.isPending}
                          >
                            {isAssigningThis ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Assigning...
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                Assign to Trip
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing strictly <strong>onboarded & registered drivers</strong> (Leads excluded).
          </span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
