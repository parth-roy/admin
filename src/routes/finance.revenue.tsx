import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";
import { useRevenue, useRevenueTrend } from "@/hooks/useFinance";

export const Route = createFileRoute("/finance/revenue")({
  head: () => ({ meta: [{ title: "Revenue — Parther Admin" }] }),
  component: RevenuePage,
});

function RevenuePage() {
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
    { l: "Active Subscriptions", v: Number(overview?.activeSubscriptions ?? 0).toLocaleString("en-IN"), c: "" },
    { l: "Total Refunds", v: `₹${Number(overview?.totalRefunds ?? 0).toLocaleString("en-IN")}`, c: "text-destructive" },
  ];

  return (
    <div>
      <PageHeader title="Revenue Overview" description="Platform-wide financial performance." />
      <div className="space-y-6 p-6">
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

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Revenue trend</CardTitle>
                <p className="text-xs text-muted-foreground">Last {days} days</p>
              </div>
              <div className="flex gap-1">
                {[7, 14, 30, 90].map(d => (
                  <button key={d}
                    onClick={() => setDays(d)}
                    className={`rounded px-2 py-1 text-xs ${days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                    {d}d
                  </button>
                ))}
              </div>
            </CardHeader>
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
            <CardHeader><CardTitle className="text-base">Bookings per day</CardTitle></CardHeader>
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
