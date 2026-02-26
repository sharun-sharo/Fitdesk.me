"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

type RevenuePoint = { month: string; revenue: number };
type GrowthPoint = { month: string; clients: number };

type Props = {
  monthlyRevenue: RevenuePoint[];
  clientGrowth: GrowthPoint[];
};

export function DashboardCharts({ monthlyRevenue, clientGrowth }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <p className="text-sm text-muted-foreground">
            Last 6 months
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value: number) => [`₹${value}`, "Revenue"]}
                  contentStyle={{ borderRadius: "8px" }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client Growth</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cumulative clients (last 6 months)
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={clientGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ borderRadius: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="clients"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
