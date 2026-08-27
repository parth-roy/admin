import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  TrendingUp, Truck, Users, AlertTriangle, ClipboardList, ShieldAlert,
  FileWarning, Activity, ArrowUpRight, ArrowDownRight, RefreshCw,
  Clock, CheckCircle2, UserCheck, Briefcase, MapPin, ExternalLink
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  head: () => ({ meta: [{ title: "Operations Dashboard — Parther Admin" }] }),
  component: Dashboard,
});

// ── Status colour map for charts ─────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "#3b82f6",
  DRIVER_ASSIGNED: "#8b5cf6",
  DRIVER_ARRIVING: "#a855f7",
  PICKED_UP: "#f59e0b",
  IN_TRANSIT: "#f97316",
  DELIVERED: "#10b981",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
  DRAFT: "#94a3b8",
};

// ── KPI Card Component ────────────────────────────────────────────────────────
function Kpi({
  label, value, delta, icon: Icon, accent = "primary", loading, href,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: any;
  accent?: "primary" | "warning" | "success" | "info";
  loading?: boolean;
  href?: string;
}) {
  const accentMap = {
    primary: "bg-blue-50 text-blue-600 border-blue-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    info: "bg-sky-50 text-sky-600 border-sky-100",
  };

  const content = (
    <Card className="relative overflow-hidden hover:shadow-md transition-all duration-200 border-slate-200/80">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <p className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {value}
              </p>
            )}
            {delta && !loading && (
              <p className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                {delta.startsWith("-") ? (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                ) : (
                  <ArrowUpRight className="h-3 w-3" />
                )}
                <span className={delta.startsWith("-") ? "text-red-500" : ""}>{delta}</span>
              </p>
            )}
          </div>
          <div className={`grid h-11 w-11 place-items-center rounded-xl border ${accentMap[accent]} shadow-xs`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href} className="block transition-transform hover:-translate-y-0.5">{content}</Link>;
  }
  return content;
}

// ── Skeleton row for tables ───────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 bg-slate-50/50">
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="space-y-1 text-right">
        <Skeleton className="h-5 w-20 ml-auto" />
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
    </div>
  );
}

function Dashboard() {
  const [trendDays, setTrendDays] = useState<number>(30);

  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useDashboardStats();

  const {
    data: trend,
    isLoading: trendLoading,
    refetch: refetchTrend,
  } = useRevenueTrend(trendDays);

  const { data: alerts, isLoading: alertsLoading } = useDashboardAlerts();
  const { data: recentBookings, isLoading: bookingsLoading, refetch: refetchBookings } = useBookings({ limit: 6, page: 1 });
  const { data: pendingDrivers, isLoading: driversLoading, refetch: refetchDrivers } = useDrivers({ isDocVerified: false, limit: 6, page: 1 });

  const handleRefreshAll = () => {
    refetchStats();
    refetchTrend();
    refetchBookings();
    refetchDrivers();
  };

  const fmt = (n?: number) => (n !== undefined && n !== null ? n.toLocaleString("en-IN") : "0");
  const fmtRs = (n?: number) => (n !== undefined && n !== null ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0");

  // ── True platform-wide booking status distribution ────────────────────────
  const rawStatusDist = stats?.statusDistribution;
  const statusDist = rawStatusDist && Object.keys(rawStatusDist).length > 0
    ? Object.entries(rawStatusDist)
        .map(([name, value]) => ({
          name,
          value: Number(value),
          color: STATUS_COLORS[name] ?? "#94a3b8",
        }))
        .sort((a, b) => b.value - a.value)
    : Object.entries(
        (recentBookings?.data ?? []).reduce((acc: Record<string, number>, b: BookingListItem) => {
          acc[b.status] = (acc[b.status] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({
        name,
        value: Number(value),
        color: STATUS_COLORS[name] ?? "#94a3b8",
      }));

  const totalStatusCount = statusDist.reduce((acc, curr) => acc + curr.value, 0);

  // ── Revenue trend data ────────────────────────────────────────────────────
  const trendData = (trend ?? []).map((d) => ({
    day: d.day.slice(5), // MM-DD
    fullDay: d.day,
    revenue: Math.round(d.revenue),
    bookings: d.bookings,
  }));

  const periodRevenue = (trend ?? []).reduce((s, d) => s + (d.revenue || 0), 0);
  const periodBookings = (trend ?? []).reduce((s, d) => s + (d.bookings || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header & Controls ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-6 py-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time platform health, revenue metrics, dispatch operations & compliance alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live indicator badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live (30s)
          </div>

          {/* Time range selector */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <Button
              variant={trendDays === 7 ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-2.5 text-xs ${trendDays === 7 ? "shadow-xs font-medium" : "text-slate-600"}`}
              onClick={() => setTrendDays(7)}
            >
              7D
            </Button>
            <Button
              variant={trendDays === 30 ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-2.5 text-xs ${trendDays === 30 ? "shadow-xs font-medium" : "text-slate-600"}`}
              onClick={() => setTrendDays(30)}
            >
              30D
            </Button>
            <Button
              variant={trendDays === 90 ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-2.5 text-xs ${trendDays === 90 ? "shadow-xs font-medium" : "text-slate-600"}`}
              onClick={() => setTrendDays(90)}
            >
              90D
            </Button>
            <Button
              variant={trendDays === 365 ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-2.5 text-xs ${trendDays === 365 ? "shadow-xs font-medium" : "text-slate-600"}`}
              onClick={() => setTrendDays(365)}
            >
              1Y
            </Button>
          </div>

          {/* Manual Refresh button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 border-slate-200 hover:bg-slate-50 text-slate-700"
            onClick={handleRefreshAll}
            disabled={statsFetching}
            title="Refresh dashboard data"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${statsFetching ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span className="text-xs font-medium">Sync</span>
          </Button>
        </div>
      </div>

      <div className="space-y-6 px-6">
        {/* ── Real-Time Alerts Strip ────────────────────────────────────── */}
        {!alertsLoading && (alerts?.ulipManualReview || alerts?.docsPending || alerts?.fleetDocsExpiring || alerts?.paymentFailures) ? (
          <Card className="border-amber-200/80 bg-amber-50/40 shadow-xs">
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <span className="font-semibold text-sm">
                  {alerts?.ulipManualReview || 0} driver{(alerts?.ulipManualReview ?? 0) !== 1 ? "s" : ""} require ULIP verification
                </span>
              </div>
              {(alerts?.docsPending ?? 0) > 0 && (
                <>
                  <span className="text-slate-300 text-xs">|</span>
                  <span className="text-xs font-medium text-slate-600">{alerts?.docsPending} docs pending review</span>
                </>
              )}
              {(alerts?.fleetDocsExpiring ?? 0) > 0 && (
                <>
                  <span className="text-slate-300 text-xs">|</span>
                  <span className="text-xs font-medium text-slate-600">{alerts?.fleetDocsExpiring} fleet docs expiring soon</span>
                </>
              )}
              {(alerts?.paymentFailures ?? 0) > 0 && (
                <>
                  <span className="text-slate-300 text-xs">|</span>
                  <span className="text-xs font-medium text-red-600">{alerts?.paymentFailures} payment failures</span>
                </>
              )}
              <Link to="/verification" className="ml-auto">
                <Button size="sm" variant="outline" className="h-7 text-xs bg-white border-amber-200 text-amber-900 hover:bg-amber-100">
                  Review All Alerts
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {/* ── Live Operations KPIs ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Operations</h2>
            <Link to="/live-map" className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1">
              Open Live Operations Map <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="kpi-grid">
            <Kpi
              loading={statsLoading}
              label="Active Bookings"
              value={fmt(stats?.activeBookings)}
              icon={Activity}
              accent="info"
              href="/bookings"
            />
            <Kpi
              loading={statsLoading}
              label="Drivers Online"
              value={fmt(stats?.driversOnline)}
              icon={Truck}
              accent="success"
              href="/drivers"
            />
            <Kpi
              loading={statsLoading}
              label="Pending Assignment"
              value={fmt(stats?.pendingAssignment)}
              icon={ShieldAlert}
              accent="warning"
              href="/dispatch"
            />
            <Kpi
              loading={statsLoading}
              label="Open Tickets"
              value={fmt(stats?.openTickets)}
              icon={ClipboardList}
              accent="primary"
              href="/support"
            />
          </div>
        </div>

        {/* ── Today's Performance KPIs ─────────────────────────────────── */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Today's Performance</h2>
          <div className="kpi-grid">
            <Kpi
              loading={statsLoading}
              label="Revenue (Today)"
              value={fmtRs(stats?.todayRevenue)}
              icon={TrendingUp}
              accent="success"
            />
            <Kpi
              loading={statsLoading}
              label="Bookings (Today)"
              value={fmt(stats?.todayBookings)}
              icon={ClipboardList}
              accent="primary"
              href="/bookings"
            />
            <Kpi
              loading={statsLoading}
              label="New Users (Today)"
              value={fmt(stats?.newUsers)}
              icon={Users}
              accent="info"
              href="/customers"
            />
            <Kpi
              loading={statsLoading}
              label="Driver Applications"
              value={fmt(stats?.driverApplications)}
              icon={FileWarning}
              accent="warning"
              href="/verification"
            />
          </div>
        </div>

        {/* ── Platform Summary Metric Pills ────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Bookings</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{fmt(stats?.totalBookings)}</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Revenue</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{fmtRs(stats?.totalRevenue)}</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Drivers</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{fmt(stats?.totalDrivers)}</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Customers</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{fmt(stats?.totalCustomers)}</p>
          </div>
          <Link to="/platform/form-driver-leads" className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs hover:bg-slate-50 transition-colors">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Driver Leads</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{fmt(stats?.formDriverLeadsCount)}</p>
          </Link>
          <Link to="/platform/form-gig-onboard-leads" className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs hover:bg-slate-50 transition-colors">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gig Leads</p>
            <p className="text-xl font-bold text-purple-600 mt-1">{fmt(stats?.formGigLeadsCount)}</p>
          </Link>
        </div>

        {/* ── Main Charts Row ───────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue & Volume Area Chart */}
          <Card className="lg:col-span-2 border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Revenue Trend</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Last {trendDays} days · Completed trip earnings ({periodBookings} trips)
                </CardDescription>
              </div>
              {trendLoading ? (
                <Skeleton className="h-6 w-28" />
              ) : (
                <Badge variant="outline" className="font-mono text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                  {fmtRs(periodRevenue)} total
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-72">
                {trendLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Skeleton className="h-full w-full rounded-md" />
                  </div>
                ) : trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        formatter={(v: any, name: any) => [
                          name === "revenue" ? `₹${Number(v).toLocaleString("en-IN")}` : v,
                          name === "revenue" ? "Revenue" : "Completed Bookings"
                        ]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#revenueGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No revenue data recorded for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Booking Status Distribution Donut */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Booking Status</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Platform breakdown ({totalStatusCount} total)
                </CardDescription>
              </div>
              <Link to="/bookings">
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-blue-600 hover:text-blue-700">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {statsLoading ? (
                <Skeleton className="h-48 w-full rounded-md" />
              ) : statusDist.length > 0 ? (
                <>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDist}
                          dataKey="value"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={3}
                        >
                          {statusDist.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                          formatter={(v: any, name: any) => [`${v} bookings (${((Number(v) / totalStatusCount) * 100).toFixed(1)}%)`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar pr-1">
                    {statusDist.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-xs py-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="font-medium text-slate-700 truncate capitalize">
                            {d.name.replace(/_/g, " ").toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-400 text-[11px]">
                            {((d.value / totalStatusCount) * 100).toFixed(0)}%
                          </span>
                          <span className="font-bold text-slate-900 tabular-nums">{d.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-slate-400">
                  No booking data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Recent Activity & Attention Queues ────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Bookings */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Recent Bookings</CardTitle>
                <CardDescription className="text-xs text-slate-500">Live platform load requests</CardDescription>
              </div>
              <Link to="/bookings">
                <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200">
                  View All ({fmt(stats?.totalBookings)})
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {bookingsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : recentBookings?.data?.length ? (
                recentBookings.data.map((b: BookingListItem) => (
                  <Link key={b.id} to="/bookings/$id" params={{ id: b.id }} className="block">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3 hover:border-blue-300 hover:bg-blue-50/20 transition-all">
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs font-semibold text-slate-700">{b.bookingNumber}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 text-slate-600 border-slate-200">
                            {b.vehicleType ? b.vehicleType.replace(/_/g, ' ') : 'TRUCK'}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
                          {b.customer?.name ?? b.customer?.phone ?? "Customer"}
                        </p>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>{b.pickupAddress ? b.pickupAddress.slice(0, 30) + '…' : 'Pickup address'}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-1.5">
                        <StatusBadge status={b.status} />
                        <p className="font-display font-bold text-sm text-slate-900 tabular-nums">
                          ₹{Number(b.grandTotal ?? b.totalFare ?? 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-10 text-center text-sm text-slate-400">
                  No recent bookings found
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drivers / Workforce Needing Attention */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Verification Queue</CardTitle>
                <CardDescription className="text-xs text-slate-500">Drivers & workforce pending approval</CardDescription>
              </div>
              <Link to="/verification">
                <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200">
                  Verification Portal
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {driversLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : pendingDrivers?.data?.length ? (
                pendingDrivers.data.map((d: DriverListItem) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3 hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-semibold text-slate-900">{d.user?.name ?? "Driver Partner"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        DL: {d.licenseNumber || "Pending"} · {d.user?.phone}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Vehicle: {d.vehicle?.vehicleNumber || "Not registered"} ({d.vehicle?.type?.replace(/_/g, ' ') || 'N/A'})
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={d.dlVerifStatus || "PENDING"} />
                      <Link to="/verification">
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs bg-white text-blue-600 border-blue-200 hover:bg-blue-50">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center space-y-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-800">All driver documents verified</p>
                  <p className="text-xs text-slate-400">No pending KYC or ULIP approvals in the queue</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
