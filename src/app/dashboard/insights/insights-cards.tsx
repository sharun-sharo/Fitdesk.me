"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  RefreshCw,
  Info,
  MessageCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export type ChurnRiskClient = {
  id: string;
  fullName: string;
  phone: string | null;
  risk: string;
  riskPercent: number;
  riskReason: string;
  daysUntil: number | null;
  pendingAmount: number;
  subscriptionEndDate?: Date | string | null;
  totalAmount: number;
};

export type ExpectedRenewalRow = {
  id: string;
  fullName: string;
  planAmount: number;
  revenueImpact: number;
  pendingAmount: number;
  riskPercent: number;
  riskReason: string;
};

type Props = {
  monthlyRevenue: number[];
  projectedRevenue: number;
  growthPercent: number;
  expectedRenewals: number;
  churnRiskCount: number;
  renewalRatePercent: number;
  revenueAtRisk: number;
  revenueCommentary: string;
  benchmarkMessage: string;
  churnRiskClients: ChurnRiskClient[];
  expectedRenewalsDetail: ExpectedRenewalRow[];
  whatIfIncrease: number;
  whatIfNewRate: number;
};

function RevenueSparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const height = 32;
  const width = 120;
  const padding = 2;
  const w = (width - padding * 2) / Math.max(1, values.length - 1);
  const points = values
    .map((v, i) => {
      const x = padding + i * w;
      const y = height - padding - (v / max) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className="rounded overflow-hidden opacity-80" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function InsightsCards({
  monthlyRevenue,
  projectedRevenue,
  growthPercent,
  expectedRenewals,
  churnRiskCount,
  renewalRatePercent,
  revenueAtRisk,
  revenueCommentary,
  benchmarkMessage,
  churnRiskClients,
  expectedRenewalsDetail,
  whatIfIncrease,
  whatIfNewRate,
}: Props) {
  const { toast } = useToast();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const cards = [
    {
      title: "Projected Revenue (Next Month)",
      value: formatCurrency(projectedRevenue),
      description: "Based on last 6 months trend",
      icon: IndianRupee,
      trend: growthPercent,
      sparkline: monthlyRevenue,
      commentary: revenueCommentary,
    },
    {
      title: "Revenue Growth %",
      value: `${growthPercent >= 0 ? "+" : ""}${growthPercent.toFixed(1)}%`,
      description: "Vs. current month",
      icon: TrendingUp,
      trend: growthPercent,
    },
    {
      title: "Revenue at Risk",
      value: formatCurrency(revenueAtRisk),
      description: "If expiring clients don't renew",
      icon: AlertTriangle,
      trend: revenueAtRisk > 0 ? -1 : null,
      highlight: revenueAtRisk > 0,
    },
    {
      title: "Expected Renewals",
      value: expectedRenewals,
      description: "Clients expiring in next 30 days",
      icon: Users,
      trend: null as number | null,
    },
    {
      title: "Renewal Rate",
      value: `${renewalRatePercent.toFixed(0)}%`,
      description: "Estimated from cohort",
      icon: RefreshCw,
      trend: null,
    },
    {
      title: "Cancellation Risk",
      value: churnRiskCount,
      description: "High or medium risk clients",
      icon: AlertTriangle,
      trend: churnRiskCount > 0 ? -1 : null,
      highlight: churnRiskCount > 0,
    },
  ];

  return (
    <>
      <div className="space-y-6">
      {/* Benchmark banner */}
        <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-foreground flex items-center gap-2 flex-wrap">
              <span className="text-emerald-600 dark:text-emerald-400">Your renewal rate: {renewalRatePercent}%</span>
              <span className="text-muted-foreground">·</span>
              <span>{benchmarkMessage}</span>
            </p>
          </CardContent>
        </Card>

        {/* What If forecasting */}
        {whatIfIncrease > 0 && (
          <Card className="rounded-2xl border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-foreground">
                If renewal rate increases from {renewalRatePercent}% → {whatIfNewRate}%, monthly revenue could increase by{" "}
                <span className="font-semibold text-primary">{formatCurrency(whatIfIncrease)}</span>.
              </p>
            </CardContent>
          </Card>
        )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const trendUp = c.trend != null && c.trend > 0;
          const trendDown = c.trend != null && c.trend < 0;
          const hasSparkline = "sparkline" in c && Array.isArray(c.sparkline);
          const commentary = "commentary" in c ? c.commentary : null;
          const highlight = "highlight" in c && c.highlight;
          return (
            <Card
              key={c.title}
              className={`rounded-xl overflow-hidden ${
                highlight ? "border-amber-500/30 dark:border-amber-500/20" : "border-border/50"
              } shadow-sm`}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  {c.title}
                  {hasSparkline && (
                    <span
                      title="Linear trend from last 6 months of payment data. Commentary is AI-generated based on renewals and risk."
                      className="cursor-help"
                    >
                      <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
                    </span>
                  )}
                </CardTitle>
                <span className="flex items-center gap-1">
                  {trendUp && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                  {trendDown && <TrendingDown className="h-4 w-4 text-amber-500" />}
                  {!trendUp && !trendDown && <Icon className="h-4 w-4 text-muted-foreground" />}
                </span>
              </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{c.value}</div>
                  {hasSparkline && (
                    <div className="mt-2 flex items-center gap-2">
                      <RevenueSparkline values={"sparkline" in c && Array.isArray(c.sparkline) ? c.sparkline : []} />
                      <span className="text-xs text-muted-foreground">Last 6 months</span>
                    </div>
                  )}
                  {commentary && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{commentary}</p>
                  )}
                  {!commentary && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Expected Renewals table */}
        {expectedRenewalsDetail.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expected Renewals (Next 30 Days)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Revenue at risk: <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(revenueAtRisk)}</span>
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Client</th>
                      <th className="pb-2 pr-4 font-medium">Plan</th>
                      <th className="pb-2 pr-4 font-medium">Revenue impact</th>
                      <th className="pb-2 font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expectedRenewalsDetail.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <Link href={`/dashboard/clients/${r.id}`} className="font-medium hover:underline">
                            {r.fullName}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{formatCurrency(r.planAmount)}</td>
                        <td className="py-2 pr-4">{formatCurrency(r.revenueImpact)}</td>
                        <td className="py-2">
                          <span
                            className={
                              r.riskPercent >= 70
                                ? "text-red-600 dark:text-red-400 font-medium"
                                : r.riskPercent >= 40
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                            }
                          >
                            {r.riskPercent}%
                          </span>
                          <span className="text-muted-foreground text-xs block">{r.riskReason}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancellation Risk table with per-client % and actions */}
        {churnRiskClients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cancellation Risk by Client</CardTitle>
              <p className="text-sm text-muted-foreground">
                Risk score 0–100% based on expiry proximity, payment delay, and engagement. Take action to reduce churn.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Client</th>
                      <th className="pb-2 pr-4 font-medium">Risk</th>
                      <th className="pb-2 pr-4 font-medium">Reason</th>
                      <th className="pb-2 font-medium w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {churnRiskClients.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 align-middle">
                        <td className="py-3 pr-4">
                          <Link href={`/dashboard/clients/${c.id}`} className="font-medium hover:underline">
                            {c.fullName}
                          </Link>
                          {c.daysUntil != null && (
                            <span className="text-xs text-muted-foreground block">{c.daysUntil}d left</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`font-semibold tabular-nums ${
                              c.riskPercent >= 70
                                ? "text-red-600 dark:text-red-400"
                                : c.riskPercent >= 40
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {c.riskPercent}%
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground max-w-[200px] truncate" title={c.riskReason}>
                          {c.riskReason}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs" asChild>
                              <Link href={`/dashboard/clients/${c.id}`}>View</Link>
                            </Button>
                            {c.phone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-lg h-8 text-xs"
                                disabled={sendingId === c.id}
                                onClick={async () => {
                                  setSendingId(c.id);
                                  try {
                                    const res = await fetch(`/api/dashboard/clients/${c.id}/send-reminder`, {
                                      method: "POST",
                                    });
                                    const data = await res.json().catch(() => ({}));
                                    if (!res.ok) {
                                      toast({
                                        title: "Failed to send",
                                        description: data.error || "Could not send reminder",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    toast({
                                      title: "Reminder sent",
                                      description: "SMS reminder sent to " + c.fullName,
                                    });
                                  } catch {
                                    toast({
                                      title: "Failed to send reminder",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setSendingId(null);
                                  }
                                }}
                              >
                                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                {sendingId === c.id ? "Sending…" : "Send message"}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
