"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { KpiCard } from "./kpi-card";
import { ActivityFeed } from "./activity-feed";
import { RevenueLineChart } from "@/components/charts/revenue-line-chart";
import { GymGrowthChart } from "@/components/charts/gym-growth-chart";
import { SubscriptionPieChart } from "@/components/charts/subscription-pie-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Building2, IndianRupee, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type DashboardData = {
  kpis: {
    totalGymOwners: number;
    activeGyms: number;
    mrr: number;
    expiringIn30Days: number;
    growthPercent: number;
  };
  revenueOverTime: { month: string; revenue: number }[];
  gymGrowth: { month: string; gyms: number }[];
  subscriptionDistribution: { name: string; value: number }[];
  lifetimeRevenue: number;
  recentActivity: { type: string; label: string; time: string; color: string }[];
};

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 mt-2 rounded-lg" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Failed to load dashboard. Refresh the page.
        </p>
      </div>
    );
  }

  const { kpis, revenueOverTime, gymGrowth, subscriptionDistribution, recentActivity, lifetimeRevenue } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Platform overview
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1 sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Key metrics and platform health
        </p>
      </div>

      {kpis.expiringIn30Days > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 shadow-sm">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            <strong>Alert:</strong> {kpis.expiringIn30Days} gym subscription{kpis.expiringIn30Days === 1 ? "" : "s"} expiring in the next 30 days. Consider following up for renewals.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Total gym owners"
          value={kpis.totalGymOwners}
          icon={Users}
          growthPercent={kpis.growthPercent}
          delay={0}
        />
        <KpiCard
          title="Active gyms"
          value={kpis.activeGyms}
          icon={Building2}
          delay={80}
        />
        <KpiCard
          title="MRR"
          value={formatCurrency(kpis.mrr)}
          icon={IndianRupee}
          delay={160}
        />
        <KpiCard
          title="Expiring in 30 days"
          value={kpis.expiringIn30Days}
          icon={AlertCircle}
          delay={240}
        />
        <Card className="admin-card overflow-hidden">
          <CardHeader className="pb-2 pt-5 px-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Lifetime revenue
            </span>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {formatCurrency(lifetimeRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="admin-card overflow-hidden">
            <CardHeader className="pb-2">
              <h3 className="text-base font-semibold text-foreground">Revenue over time</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Last 12 months</p>
            </CardHeader>
            <CardContent>
              <RevenueLineChart data={revenueOverTime} />
            </CardContent>
          </Card>
          <Card className="admin-card overflow-hidden">
            <CardHeader className="pb-2">
              <h3 className="text-base font-semibold text-foreground">Gym growth</h3>
              <p className="text-sm text-muted-foreground mt-0.5">New gyms per month</p>
            </CardHeader>
            <CardContent>
              <GymGrowthChart data={gymGrowth} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="admin-card overflow-hidden">
            <CardHeader className="pb-2">
              <h3 className="text-base font-semibold text-foreground">Subscription distribution</h3>
              <p className="text-sm text-muted-foreground mt-0.5">By plan</p>
            </CardHeader>
            <CardContent>
              <SubscriptionPieChart data={subscriptionDistribution} />
            </CardContent>
          </Card>
          <ActivityFeed activities={recentActivity} />
        </div>
      </div>
    </div>
  );
}
