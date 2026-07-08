import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDrivers } from "@/hooks/useDrivers";
import { useFleetOwners } from "@/hooks/useFleet";
import type { DriverListItem, FleetOwnerListItem } from "@/lib/api/types";
import { ShieldCheck, ShieldAlert, Truck, UserCircle, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/compliance")({
  head: () => ({ meta: [{ title: "Compliance Score Monitor — Parther Admin" }] }),
  component: ComplianceMonitorPage,
});

function getScoreColor(score: number = 0) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function getScoreTextColor(score: number = 0) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-rose-500";
}

function ComplianceMonitorPage() {
  const [tab, setTab] = useState("drivers");

  const { data: driversData, isLoading: loadingDrivers } = useDrivers({ limit: 100 });
  const { data: fleetData, isLoading: loadingFleet } = useFleetOwners({ limit: 100 });

  // Sort by lowest score first to highlight non-compliant users
  const drivers = [...(driversData?.data ?? [])].sort((a, b) => (a.complianceScore ?? 0) - (b.complianceScore ?? 0));
  const fleets = [...(fleetData?.data ?? [])].sort((a, b) => (a.complianceScore ?? 0) - (b.complianceScore ?? 0));

  return (
    <div className="flex flex-col gap-6 p-6 pb-20">
      <PageHeader
        title="Compliance Scoring Engine"
        description="Unified health monitor scoring Fleet Owners and Drivers based on strict document and ULIP verifications."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="w-[400px]">
          <TabsTrigger value="drivers" className="flex-1 gap-2">
            <UserCircle className="h-4 w-4" /> Drivers
          </TabsTrigger>
          <TabsTrigger value="fleet" className="flex-1 gap-2">
            <Truck className="h-4 w-4" /> Fleet Owners
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingDrivers ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : drivers.length ? (
              drivers.map((d: DriverListItem) => (
                <Card key={d.id} className="relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${getScoreColor(d.complianceScore)}`} />
                  <CardContent className="p-5 pl-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-base">{d.user?.name ?? "Unknown"}</h3>
                        <p className="text-xs text-muted-foreground">{d.user?.phone}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-2xl font-bold tracking-tighter ${getScoreTextColor(d.complianceScore)}`}>
                          {d.complianceScore ?? 0}%
                        </span>
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Score</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <Progress value={d.complianceScore ?? 0} indicatorColor={getScoreColor(d.complianceScore)} className="h-2" />
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline" className={d.dlVerifStatus === 'VERIFIED' ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}>DL</Badge>
                      <Badge variant="outline" className={d.isDocVerified ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}>Docs</Badge>
                      <Badge variant="outline" className={d.vehicle?.rcVerifStatus === 'VERIFIED' ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}>RC</Badge>
                      <Badge variant="outline" className={d.user?.isActive ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}>Active</Badge>
                    </div>

                    <Link to="/verification" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground">No drivers found.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="fleet" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingFleet ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : fleets.length ? (
              fleets.map((f: FleetOwnerListItem) => (
                <Card key={f.id} className="relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${getScoreColor(f.complianceScore)}`} />
                  <CardContent className="p-5 pl-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-base">{f.companyName ?? f.user?.name ?? "Unknown"}</h3>
                        <p className="text-xs text-muted-foreground">{f.user?.phone}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-2xl font-bold tracking-tighter ${getScoreTextColor(f.complianceScore)}`}>
                          {f.complianceScore ?? 0}%
                        </span>
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Score</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <Progress value={f.complianceScore ?? 0} indicatorColor={getScoreColor(f.complianceScore)} className="h-2" />
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline" className={f.isVerified ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}>Verified</Badge>
                      <Badge variant="outline" className={f.user?.isActive ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}>Active</Badge>
                      <Badge variant="outline" className="border-border">
                        {f._count?.trucks ?? 0} Trucks
                      </Badge>
                    </div>

                    <Link to="/fleet/compliance" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground">No fleet owners found.</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
