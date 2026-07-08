import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, TrendingUp, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { useRevenue, useRevenueTrend } from "@/hooks/useFinance";
import { useBookings } from "@/hooks/useBookings";
import { bookingsApi } from "@/lib/api/bookings.api";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Parther Admin" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const [days, setDays] = useState(30);
  const { data: overview, isLoading: ovLoading } = useRevenue({});
  const { data: trend, isLoading: trendLoading } = useRevenueTrend(days);

  const trendData = (trend ?? []).map(d => ({
    day: d.day.slice(5),
    revenue: Math.round(d.revenue),
    bookings: d.bookings,
  }));

  const kpis = [
    { l: "Total Revenue", v: `₹${Number(overview?.totalRevenue ?? 0).toLocaleString("en-IN")}`, c: "text-success" },
    { l: "Total Bookings", v: Number(overview?.totalBookings ?? 0).toLocaleString("en-IN"), c: "" },
    { l: "Platform Commission", v: `₹${Number(overview?.platformCommission ?? 0).toLocaleString("en-IN")}`, c: "text-primary" },
    { l: "Total Refunds", v: `₹${Number(overview?.totalRefunds ?? 0).toLocaleString("en-IN")}`, c: "text-destructive" },
  ];

  const handleExportBookings = () => {
    const url = bookingsApi.exportCsv();
    window.open(url, "_blank");
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Platform performance analytics and exports."
        actions={
          <Button variant="outline" size="sm" onClick={handleExportBookings}>
            <Download className="h-4 w-4 mr-1" />Export Bookings CSV
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        {/* KPI Summary */}
        <div className="kpi-grid">
          {kpis.map(s => (
            <Card key={s.l}><CardContent className="p-5">
              <p className="text-xs uppercase text-muted-foreground">{s.l}</p>
              {ovLoading ? <Skeleton className="mt-2 h-9 w-28" /> : (
                <p className={`mt-2 font-display text-2xl font-semibold tabular-nums ${s.c}`}>{s.v}</p>
              )}
            </CardContent></Card>
          ))}
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time range:</span>
          {[7, 14, 30, 90].map(d => (
            <button key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${days === d ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}>
              {d}d
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                {trendLoading ? <Skeleton className="h-full w-full rounded-md" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                        formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
                      <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Booking volume</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                {trendLoading ? <Skeleton className="h-full w-full rounded-md" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="bookings" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
