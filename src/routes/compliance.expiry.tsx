import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpiringTrucks } from "@/hooks/useFleet";

export const Route = createFileRoute("/compliance/expiry")({
  head: () => ({ meta: [{ title: "Compliance Expiry — Parther Admin" }] }),
  component: ComplianceExpiryPage,
});

function ComplianceExpiryPage() {
  const { data: expiring30, isLoading: l30 } = useExpiringTrucks(30);
  const { data: expiring7, isLoading: l7 } = useExpiringTrucks(7);

  const daysLeft = (iso: string | null) => {
    if (!iso) return null;
    return Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
  };

  const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-IN") : "—";

  const criticals = (expiring7 ?? []).filter((t: any) =>
    [t.insuranceExpiry, t.fitnessExpiry, t.pucExpiry, t.permitExpiry].some(d => d && daysLeft(d)! <= 7)
  );

  return (
    <div>
      <PageHeader
        title="Document Expiry Alerts"
        description="Critical and upcoming fleet document expirations."
      />
      <div className="space-y-6 p-6">
        {/* Critical — next 7 days */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Critical — next 7 days
          </h2>
          {l7 ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : criticals.length ? (
            <div className="space-y-2">
              {criticals.map((t: any) => (
                <Card key={t.id} className="border-destructive/30 bg-destructive/5">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-mono text-sm font-medium">{t.registrationNo}</p>
                      <p className="text-xs text-muted-foreground">{t.fleetOwner?.companyName ?? t.fleetOwner?.user?.name ?? "—"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {[
                        { label: "Insurance", exp: t.insuranceExpiry },
                        { label: "Fitness", exp: t.fitnessExpiry },
                        { label: "PUC", exp: t.pucExpiry },
                        { label: "Permit", exp: t.permitExpiry },
                      ].filter(x => x.exp && daysLeft(x.exp)! <= 7).map(x => (
                        <div key={x.label} className="rounded bg-destructive/15 px-2 py-1 text-destructive">
                          {x.label}: {fmtDate(x.exp)} ({daysLeft(x.exp)}d left)
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">✅ No critical expirations in next 7 days</CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming — 8–30 days */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-warning-foreground">Upcoming — next 30 days</h2>
          {l30 ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <p className="text-sm text-muted-foreground">
                  {(expiring30 ?? []).length} vehicles have documents expiring within 30 days
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/fleet/compliance">
                    View full list <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
