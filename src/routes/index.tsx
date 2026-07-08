import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  TrendingUp, Truck, Users, AlertTriangle, ClipboardList, ShieldAlert,
  FileWarning, Activity, ArrowUpRight, ArrowDownRight, RefreshCw,
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Link } from "@tanstack/react-router";
import { useDashboardStats, useRevenueTrend, useDashboardAlerts } from "@/hooks/useDashboard";
import { useBookings } from "@/hooks/useBookings";
import { useDrivers } from "@/hooks/useDrivers";
import type { BookingListItem, DriverListItem } from "@/lib/api/types";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Parther Admin" }] }),
  component: Dashboard,
});

// ── Status colour map for the pie chart ──────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "#3b82f6",
  DRIVER_ASSIGNED: "#8b5cf6",
  IN_TRANSIT: "#f59e0b",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
  DELIVERED: "#10b981",
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
function Kpi({
  label, value, delta, icon: Icon, accent, loading,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: any;
  accent?: "primary" | "warning" | "success" | "info";
  loading?: boolean;
}) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/20 text-warning-foreground",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
  };
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-9 w-20" />
            ) : (
              <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
            )}
            {delta && !loading && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-success">
                {delta.startsWith("-") ? (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                ) : (
                  <ArrowUpRight className="h-3 w-3" />
                )}
                <span className={delta.startsWith("-") ? "text-destructive" : ""}>{delta}</span>
              </p>
            )}
          </div>
          <div className={`grid h-10 w-10 place-items-center rounded-lg ${accentMap[accent ?? "primary"]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeleton row for tables ───────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-14" />
      </div>
    </div>
  );
}

function Dashboard() {
  const [trendDays, setTrendDays] = useState(30);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: trend, isLoading: trendLoading } = useRevenueTrend(trendDays);
  const { data: alerts, isLoading: alertsLoading } = useDashboardAlerts();
  const { data: recentBookings, isLoading: bookingsLoading } = useBookings({ limit: 6, page: 1 });
  const { data: pendingDrivers, isLoading: driversLoading } = useDrivers({ isDocVerified: false, limit: 6, page: 1 });

  const fmt = (n?: number) => n !== undefined ? n.toLocaleString("en-IN") : "—";
  const fmtRs = (n?: number) => n !== undefined ? `₹${n.toLocaleString("en-IN")}` : "—";

  // Build booking status distribution from recent data
  const statusDist = Object.entries(
    (recentBookings?.data ?? []).reduce((acc: Record<string, number>, b: BookingListItem) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] ?? "#94a3b8" }));

  // Revenue trend for chart
  const trendData = (trend ?? []).map(d => ({
    day: d.day.slice(5), // MM-DD
    revenue: Math.round(d.revenue),
    bookings: d.bookings,
  }));

  const mtdRevenue = (trend ?? []).reduce((s, d) => s + d.revenue, 0);

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        description="Real-time platform health, revenue & alerts."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setTrendDays(7)}>Week</Button>
            <Button variant={trendDays === 30 ? "default" : "outline"} size="sm" onClick={() => setTrendDays(30)}>Month</Button>
            <Button variant="ghost" size="sm" onClick={() => refetchStats()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-6">
        {/* Alert strip */}
        {!alertsLoading && (alerts?.ulipManualReview || alerts?.fleetDocsExpiring || alerts?.paymentFailures) ? (
          <Card className="border-warning/40 bg-warning/5">
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex items-center gap-2 text-warning-foreground">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium text-sm">
                  {alerts?.ulipManualReview} driver{alerts?.ulipManualReview !== 1 ? "s" : ""} require ULIP manual review
                </span>
              </div>
              {alerts?.docsPending > 0 && (
                <>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-sm text-muted-foreground">{alerts.docsPending} docs pending verification</span>
                </>
              )}
              {alerts?.fleetDocsExpiring > 0 && (
                <>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-sm text-muted-foreground">{alerts.fleetDocsExpiring} fleet docs expiring within 30 days</span>
                </>
              )}
              {alerts?.paymentFailures > 0 && (
                <>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-sm text-muted-foreground">{alerts.paymentFailures} payment failures</span>
                </>
              )}
              <Link to="/verification">
                <Button size="sm" variant="ghost" className="ml-auto">Review all</Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {/* Live Ops KPIs */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live operations</h2>
          <div className="kpi-grid">
            <Kpi loading={statsLoading} label="Active bookings" value={fmt(stats?.activeBookings)} icon={Activity} accent="info" />
            <Kpi loading={statsLoading} label="Drivers online" value={fmt(stats?.driversOnline)} icon={Truck} accent="success" />
            <Kpi loading={statsLoading} label="Pending assignment" value={fmt(stats?.pendingAssignment)} icon={ShieldAlert} accent="warning" />
            <Kpi loading={statsLoading} label="Open tickets" value={fmt(stats?.openTickets)} icon={ClipboardList} accent="primary" />
          </div>
        </div>

        {/* Today KPIs */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today</h2>
          <div className="kpi-grid">
            <Kpi loading={statsLoading} label="Revenue (today)" value={fmtRs(stats?.todayRevenue)} icon={TrendingUp} accent="success" />
            <Kpi loading={statsLoading} label="Bookings (today)" value={fmt(stats?.todayBookings)} icon={ClipboardList} accent="primary" />
            <Kpi loading={statsLoading} label="New users" value={fmt(stats?.newUsers)} icon={Users} accent="info" />
            <Kpi loading={statsLoading} label="Driver applications" value={fmt(stats?.driverApplications)} icon={FileWarning} accent="warning" />
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Revenue trend</CardTitle>
                <p className="text-xs text-muted-foreground">Last {trendDays} days · Completed bookings</p>
              </div>
              {trendLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <Badge variant="outline" className="font-mono">
                  {fmtRs(mtdRevenue)} total
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {trendLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Skeleton className="h-full w-full rounded-md" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                        formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booking status</CardTitle>
              <p className="text-xs text-muted-foreground">Current distribution</p>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <Skeleton className="h-48 w-full rounded-md" />
              ) : statusDist.length > 0 ? (
                <>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDist} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                          {statusDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {statusDist.map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: d.color }} />
                        <span className="flex-1 capitalize">{d.name.replace(/_/g, " ")}</span>
                        <span className="tabular-nums font-medium">{d.value as number}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No booking data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent bookings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bookingsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : recentBookings?.data?.length ? (
                recentBookings.data.map((b: BookingListItem) => (
                  <Link key={b.id} to="/bookings/$id" params={{ id: b.id }}>
                    <div className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/40 transition-colors">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{b.bookingNumber}</p>
                        <p className="text-sm font-medium">{b.customer?.name ?? b.customer?.phone ?? "Customer"}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <StatusBadge status={b.status} />
                        <p className="font-mono text-sm tabular-nums">₹{Number(b.totalFare ?? 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No recent bookings</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Drivers needing attention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {driversLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : pendingDrivers?.data?.length ? (
                pendingDrivers.data.map((d: DriverListItem) => (
                  <div key={d.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{d.user?.name ?? "Driver"}</p>
                      <p className="text-xs text-muted-foreground">{d.licenseNumber} · {d.user?.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={d.dlVerifStatus} />
                      <Link to="/verification">
                        <Button size="sm" variant="outline">Review</Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  ✅ No drivers needing attention
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
