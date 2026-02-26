import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, TrendingUp, TrendingDown, Users, AlertTriangle, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

type ChurnClient = { id: string; fullName: string; risk: string; daysUntil: number | null };

type Props = {
  projectedRevenue: number;
  growthPercent: number;
  expectedRenewals: number;
  churnRiskCount: number;
  renewalRatePercent: number;
  churnRiskClients: ChurnClient[];
};

export function InsightsCards({
  projectedRevenue,
  growthPercent,
  expectedRenewals,
  churnRiskCount,
  renewalRatePercent,
  churnRiskClients,
}: Props) {
  const cards = [
    {
      title: "Projected Revenue (Next Month)",
      value: formatCurrency(projectedRevenue),
      description: "Based on last 6 months trend",
      icon: IndianRupee,
      trend: growthPercent,
    },
    {
      title: "Revenue Growth %",
      value: `${growthPercent >= 0 ? "+" : ""}${growthPercent.toFixed(1)}%`,
      description: "Vs. current month",
      icon: TrendingUp,
      trend: growthPercent,
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
      description: "Estimated from expiring cohort",
      icon: RefreshCw,
      trend: null,
    },
    {
      title: "Cancellation Risk",
      value: churnRiskCount,
      description: "Expiring soon or unpaid",
      icon: AlertTriangle,
      trend: churnRiskCount > 0 ? -1 : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const trendUp = c.trend != null && c.trend > 0;
          const trendDown = c.trend != null && c.trend < 0;
          return (
            <Card key={c.title} className="rounded-xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {c.title}
                </CardTitle>
                <span className="flex items-center gap-1">
                  {trendUp && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                  {trendDown && <TrendingDown className="h-4 w-4 text-amber-500" />}
                  {!trendUp && !trendDown && <Icon className="h-4 w-4 text-muted-foreground" />}
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {churnRiskClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cancellation Risk Clients</CardTitle>
            <p className="text-sm text-muted-foreground">
              Consider following up for renewal or payment
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {churnRiskClients.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <Link
                    href={`/dashboard/clients/${c.id}`}
                    className="font-medium hover:underline"
                  >
                    {c.fullName}
                  </Link>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      c.risk === "high"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {c.risk} risk
                    {c.daysUntil != null && ` · ${c.daysUntil}d left`}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
