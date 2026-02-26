"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  UserX,
  IndianRupee,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAnimatedNumber } from "@/hooks/use-animated-number";

type Kpis = {
  totalClients: number;
  activeClients: number;
  expiredClients: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  pendingPayments: number;
  revenueGrowthPercent: number;
  clientGrowthPercent: number;
};

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const positive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        positive
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
      }`}
    >
      {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

function AnimatedValue({
  value,
  formatter = (n: number) => String(n),
  enabled,
}: {
  value: number;
  formatter?: (n: number) => string;
  enabled: boolean;
}) {
  const animated = useAnimatedNumber(value, 700, enabled);
  return <>{formatter(animated)}</>;
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-2 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const CARD_ACCENTS = [
  { icon: "bg-slate-500/15 text-slate-700 dark:text-slate-300", border: "border-l-slate-400/50" },
  { icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", border: "border-l-emerald-500/60" },
  { icon: "bg-amber-500/15 text-amber-700 dark:text-amber-300", border: "border-l-amber-500/60" },
  { icon: "bg-violet-500/15 text-violet-700 dark:text-violet-300", border: "border-l-violet-500/60" },
  { icon: "bg-blue-500/15 text-blue-700 dark:text-blue-300", border: "border-l-blue-500/60" },
  { icon: "bg-rose-500/15 text-rose-700 dark:text-rose-300", border: "border-l-rose-500/60" },
] as const;

export function KpiCards({ kpis, ready }: { kpis: Kpis; ready: boolean }) {
  const cards = [
    {
      title: "Total Clients",
      value: kpis.totalClients,
      formatter: (n: number) => String(n),
      icon: Users,
      sub: "All time",
      growth: null as number | null,
    },
    {
      title: "Active Clients",
      value: kpis.activeClients,
      formatter: (n: number) => String(n),
      icon: UserCheck,
      sub: "Subscription active",
      growth: null,
    },
    {
      title: "Expired Clients",
      value: kpis.expiredClients,
      formatter: (n: number) => String(n),
      icon: UserX,
      sub: "Need renewal",
      growth: null,
    },
    {
      title: "Revenue This Month",
      value: kpis.revenueThisMonth,
      formatter: (n: number) => formatCurrency(n),
      icon: IndianRupee,
      sub: "From payments",
      growth: kpis.revenueGrowthPercent,
    },
    {
      title: "Revenue This Year",
      value: kpis.revenueThisYear,
      formatter: (n: number) => formatCurrency(n),
      icon: IndianRupee,
      sub: "YTD",
      growth: null,
    },
    {
      title: "Pending Payments",
      value: kpis.pendingPayments,
      formatter: (n: number) => formatCurrency(n),
      icon: CreditCard,
      sub: "Outstanding",
      growth: null,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        const accent = CARD_ACCENTS[i];
        return (
          <div key={c.title} className="group">
            <Card
              className={`overflow-hidden rounded-2xl border-l-4 border border-border/50 bg-card shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-border ${accent.border}`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
                <CardTitle className="text-card-title uppercase tracking-wide text-foreground">
                  {c.title}
                </CardTitle>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${accent.icon}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <div className="text-metric text-foreground">
                  <AnimatedValue value={c.value} formatter={c.formatter} enabled={ready} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="text-card-subtext">{c.sub}</p>
                  {c.growth != null && <GrowthBadge value={c.growth} />}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
