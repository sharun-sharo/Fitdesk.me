"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type Point = { name: string; value: number };

const COLORS = [
  "hsl(var(--primary))",
  "hsl(142 76% 36%)",
  "hsl(262 83% 58%)",
  "hsl(24 95% 53%)",
];

export function SubscriptionPieChart({ data }: { data: Point[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const withPercent = data.map((d) => ({
    ...d,
    percent: total > 0 ? Math.round((d.value / total) * 100) : 0,
  }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={withPercent}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            animationBegin={0}
            animationDuration={600}
          >
            {withPercent.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: { payload: { percent: number } }) =>
              [`${value} gyms (${props.payload.percent}%)`, name]
            }
            contentStyle={{ borderRadius: "12px" }}
          />
          <Legend formatter={(name) => name} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
