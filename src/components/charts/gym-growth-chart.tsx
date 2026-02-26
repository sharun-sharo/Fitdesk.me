"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Point = { month: string; gyms: number };

export function GymGrowthChart({ data }: { data: Point[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: "12px" }} />
          <Bar
            dataKey="gyms"
            fill="hsl(var(--primary))"
            radius={[6, 6, 0, 0]}
            name="New gyms"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
