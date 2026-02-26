"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartsDateRangeFilter } from "./charts-date-range-filter";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export { ClientGrowthCard, ActiveVsExpiredCard } from "./dashboard-chart-cards";

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

type RevenuePoint = { month: string; revenue: number };
type GrowthPoint = { month: string; clients: number };
type PiePoint = { name: string; value: number };

type Props = {
  monthlyRevenue: RevenuePoint[];
  clientGrowth: GrowthPoint[];
  activeVsExpired: PiePoint[];
  hideRevenueChart?: boolean;
  rangeLabel?: string;
};

export function DashboardChartsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border/50 lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-28 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardChartsPremium({
  monthlyRevenue,
  clientGrowth,
  activeVsExpired,
  hideRevenueChart,
  rangeLabel,
}: Props) {
  return (
    <div className={`grid gap-6 ${hideRevenueChart ? "grid-cols-1" : "lg:grid-cols-2"}`}>
      {!hideRevenueChart && (
        <Card className="overflow-hidden rounded-xl border-border/50 bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <p className="text-sm text-muted-foreground">Last 6 months</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value: number) => [value ? `₹${value}` : "₹0", "Revenue"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="dashboard-card overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/10">
        <CardHeader className="flex flex-col gap-3">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">Client Growth</CardTitle>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {rangeLabel ? `Showing: ${rangeLabel}` : "Cumulative"} · Cumulative clients
            </p>
          </div>
          <div>
            <ChartsDateRangeFilter />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                <XAxis dataKey="month" className="text-xs font-medium" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs font-medium" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", fontWeight: 600 }}
                />
                <Bar
                  dataKey="clients"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  name="Clients"
                  isAnimationActive
                  animationDuration={500}
                  animationEasing="ease-out"
                >
                  {clientGrowth.map((_, i) => (
                    <Cell key={i} className="transition-opacity duration-200 hover:opacity-90" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-card overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/10 lg:col-span-2">
        <CardHeader className="flex flex-col gap-3">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">Active vs Expired</CardTitle>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {rangeLabel ? `Showing: ${rangeLabel}` : ""} · Subscription status
            </p>
          </div>
          <div>
            <ChartsDateRangeFilter />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            {activeVsExpired.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeVsExpired}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    isAnimationActive
                    animationDuration={500}
                    animationEasing="ease-out"
                  >
                    {activeVsExpired.map((_, i) => (
                      <Cell key={i} className="transition-opacity duration-200 hover:opacity-90" fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, "Clients"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", fontWeight: 600 }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                No client data yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
