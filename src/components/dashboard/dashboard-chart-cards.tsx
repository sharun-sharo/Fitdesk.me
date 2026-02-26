"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartsDateRangeFilter } from "./charts-date-range-filter";
import {
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

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

type GrowthPoint = { month: string; clients: number };
type PiePoint = { name: string; value: number };

const CARD_BASE = "overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm";

type ChartCardProps = {
  clientGrowth: GrowthPoint[];
  rangeLabel?: string;
};

type ActiveVsExpiredCardProps = {
  activeVsExpired: PiePoint[];
  rangeLabel?: string;
};

export function ClientGrowthCard({ clientGrowth, rangeLabel }: ChartCardProps) {
  return React.createElement(Card, { className: CARD_BASE },
    React.createElement(CardHeader, { className: "flex flex-col gap-3" },
      React.createElement("div", null,
        React.createElement(CardTitle, { className: "text-lg font-bold tracking-tight" }, "Client Growth"),
        React.createElement("p", { className: "mt-0.5 text-sm font-medium text-muted-foreground" },
          rangeLabel ? `Showing: ${rangeLabel} · Cumulative clients` : "Cumulative · Cumulative clients")
      ),
      React.createElement("div", null, React.createElement(ChartsDateRangeFilter, null))
    ),
    React.createElement(CardContent, null,
      React.createElement("div", { className: "h-[300px]" },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(BarChart, { data: clientGrowth, margin: { top: 5, right: 10, left: 0, bottom: 0 } },
            React.createElement(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted/50" }),
            React.createElement(XAxis, { dataKey: "month", className: "text-xs font-medium", tick: { fill: "hsl(var(--muted-foreground))" } }),
            React.createElement(YAxis, { className: "text-xs font-medium", tick: { fill: "hsl(var(--muted-foreground))" } }),
            React.createElement(Tooltip, { contentStyle: { borderRadius: "12px", border: "1px solid hsl(var(--border))", fontWeight: 600 } }),
            React.createElement(Bar, {
              dataKey: "clients",
              fill: "hsl(var(--primary))",
              radius: [6, 6, 0, 0],
              name: "Clients",
              isAnimationActive: true,
              animationDuration: 500,
              animationEasing: "ease-out",
            }, clientGrowth.map((_, i) => React.createElement(Cell, { key: i, className: "transition-opacity duration-200 hover:opacity-90" })))
          )
        )
      )
    )
  );
}

export function ActiveVsExpiredCard({ activeVsExpired, rangeLabel }: ActiveVsExpiredCardProps) {
  return (<Card className={CARD_BASE}>
      <CardHeader className="flex flex-col gap-3">
        <div>
          <CardTitle className="text-lg font-bold tracking-tight">Active vs Expired</CardTitle>
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
            <div className="flex min-h-[200px] items-center justify-center text-sm font-medium text-muted-foreground">
              No client data yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
