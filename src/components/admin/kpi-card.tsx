"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  growthPercent?: number;
  delay?: number;
};

export function KpiCard({ title, value, icon: Icon, growthPercent, delay = 0 }: Props) {
  const [mounted, setMounted] = useState(false);
  const [displayValue, setDisplayValue] = useState(
    typeof value === "number" ? 0 : value
  );

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (typeof value !== "number") {
      setDisplayValue(value);
      return;
    }
    if (!mounted) return;
    const duration = 800;
    const start = 0;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (value - start) * easeOut));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, mounted]);

  return (
    <Card className="admin-card group overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-5 w-5" />
        </span>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {typeof displayValue === "number" ? displayValue : displayValue}
        </div>
        {growthPercent !== undefined && (
          <div
            className={cn(
              "inline-flex items-center gap-1 mt-2 rounded-full px-2 py-0.5 text-xs font-semibold",
              growthPercent >= 0
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}
          >
            {growthPercent >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {growthPercent >= 0 ? "+" : ""}
            {growthPercent}% vs last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}
