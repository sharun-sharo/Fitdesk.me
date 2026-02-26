"use client";

import { useMemo } from "react";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { KpiCards, KpiCardsSkeleton } from "./kpi-cards";
import {
  DashboardChartsSkeleton,
  ClientGrowthCard,
  ActiveVsExpiredCard,
} from "./dashboard-charts";
import { QuickActions } from "./quick-actions";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { AlertBanner } from "./alert-banner";
import { RecentActivity } from "./recent-activity";
import { RevenueChartEnhanced } from "./revenue-chart-enhanced";
import { AIInsightsCard } from "./ai-insights-card";
import { ExpiringSoonList } from "./expiring-soon-list";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export function DashboardView({ userName }: { userName?: string }) {
  const { apiParams, rangeLabel } = useDashboardFilters();
  const { data, loading, error } = useDashboardStats(apiParams, "monthly");
  const greeting = useMemo(() => getGreeting(), []);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center animate-in fade-in duration-300">
        <p className="text-base font-semibold text-destructive">{error}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Refresh the page or try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-300">
      {/* Welcome */}
      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground sm:text-xl">
          {greeting}, {userName ?? "User"} <span aria-hidden>👋</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Here&apos;s your gym overview for today.
        </p>
      </div>

      {data && (
        <AlertBanner
          expiredCount={data.kpis.expiredClients}
          pendingPayments={data.kpis.pendingPayments}
        />
      )}

      <QuickActions />

      {/* Key metrics */}
      <section className="space-y-3">
        <h2 className="text-section-label">
          Key metrics
        </h2>
        {loading ? (
          <KpiCardsSkeleton />
        ) : data ? (
          <div className="animate-in slide-up duration-500">
            <KpiCards kpis={data.kpis} ready={!loading} />
          </div>
        ) : null}
      </section>

      {loading ? (
        <DashboardChartsSkeleton />
      ) : data ? (
        <>
          <section className="space-y-3">
            <h2 className="text-section-label">
              Revenue & growth
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start animate-in slide-up duration-500">
              <RevenueChartEnhanced
                data={data.monthlyRevenue}
                rangeLabel={rangeLabel}
              />
              <ClientGrowthCard
                clientGrowth={data.clientGrowth}
                rangeLabel={rangeLabel}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-section-label">
              Activity & insights
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
              <div className="space-y-6">
                <ExpiringSoonList items={data.expiringSoon ?? []} />
                <RecentActivity items={data.recentActivity ?? []} />
              </div>
              <div className="space-y-6">
                <ActiveVsExpiredCard
                  activeVsExpired={data.activeVsExpired}
                  rangeLabel={rangeLabel}
                />
                <AIInsightsCard
                  revenueThisMonth={data.kpis.revenueThisMonth}
                  revenueGrowthPercent={data.kpis.revenueGrowthPercent}
                  monthlyRevenue={data.monthlyRevenue.map((p) => p.revenue)}
                  expiredClients={data.kpis.expiredClients}
                  pendingPayments={data.kpis.pendingPayments}
                  activeClients={data.kpis.activeClients}
                />
              </div>
            </div>
          </section>
        </>
      ) : null}

      {loading && !data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/50 bg-card/80 h-48 animate-pulse" />
          <div className="rounded-2xl border border-border/50 bg-card/80 h-48 animate-pulse" />
        </div>
      ) : null}
    </div>
  );
}
