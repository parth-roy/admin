import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Save, IndianRupee } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { usePricing, useUpdatePricing } from "@/hooks/usePlatform";
import type { VehicleType } from "@/lib/api/types";

export const Route = createFileRoute("/platform/pricing")({
  head: () => ({ meta: [{ title: "Pricing Config — Parther Admin" }] }),
  component: PricingPage,
});

const VEHICLE_LABELS: Record<string, string> = {
  BIKE: "Bike / 2-Wheeler",
  THREE_WHEELER: "3-Wheeler / Auto",
  TATA_ACE: "Tata Ace / Mini Van",
  MINI_TRUCK: "Mini Truck",
  TRUCK_14FT: "14 ft Truck",
  TRUCK_17FT: "17 ft Truck",
  TRUCK_20FT: "20 ft Truck",
  TRUCK_24FT: "24 ft Truck",
  CONTAINER_20FT: "20 ft Container",
  CONTAINER_40FT: "40 ft Container",
};

function PricingCard({ rule }: { rule: any }) {
  const [baseFare, setBaseFare] = useState(String(rule.baseFare ?? ""));
  const [perKm, setPerKm] = useState(String(rule.perKmRate ?? ""));
  const [minFare, setMinFare] = useState(String(rule.minFare ?? ""));
  const [platformFee, setPlatformFee] = useState(String(rule.platformFeePercent ?? ""));
  const updateMut = useUpdatePricing();
  const dirty =
    baseFare !== String(rule.baseFare) ||
    perKm !== String(rule.perKmRate) ||
    minFare !== String(rule.minFare) ||
    platformFee !== String(rule.platformFeePercent);

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync({
        vehicleType: rule.vehicleType as VehicleType,
        data: {
          baseFare: parseFloat(baseFare),
          perKmRate: parseFloat(perKm),
          minFare: parseFloat(minFare),
          platformFeePercent: parseFloat(platformFee),
        },
      });
      toast.success(`${VEHICLE_LABELS[rule.vehicleType] ?? rule.vehicleType} pricing updated`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Update failed");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold">{VEHICLE_LABELS[rule.vehicleType] ?? rule.vehicleType}</CardTitle>
        {dirty && (
          <Button size="sm" className="h-7 text-xs" disabled={updateMut.isPending} onClick={handleSave}>
            {updateMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
            Save
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Base Fare (₹)</Label>
          <Input type="number" className="h-8" value={baseFare} onChange={e => setBaseFare(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Per km rate (₹)</Label>
          <Input type="number" className="h-8" value={perKm} onChange={e => setPerKm(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Min fare (₹)</Label>
          <Input type="number" className="h-8" value={minFare} onChange={e => setMinFare(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Platform fee (%)</Label>
          <Input type="number" className="h-8" value={platformFee} onChange={e => setPlatformFee(e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
}

function PricingPage() {
  const { data: rules, isLoading } = usePricing();

  return (
    <div>
      <PageHeader
        title="Pricing Configuration"
        description="Set base fare, per-km rates and platform fee per vehicle type."
        actions={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IndianRupee className="h-3.5 w-3.5" />
            Changes apply immediately to new bookings
          </div>
        }
      />
      <div className="p-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
          </div>
        ) : rules?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rules.map((rule: any) => <PricingCard key={rule.vehicleType} rule={rule} />)}
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground">No pricing rules found</div>
        )}
      </div>
    </div>
  );
}
