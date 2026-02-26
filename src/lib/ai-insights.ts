/**
 * Simple linear regression: y = mx + b
 * Used for revenue projection from last N months.
 */
export function linearRegression(
  points: { x: number; y: number }[]
): { slope: number; intercept: number } {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function projectNextMonth(
  monthlyValues: number[]
): { projected: number; growthPercent: number } {
  const points = monthlyValues.map((y, i) => ({ x: i, y }));
  const { slope, intercept } = linearRegression(points);
  const nextX = points.length;
  const projected = Math.max(0, slope * nextX + intercept);
  const lastMonth = monthlyValues[monthlyValues.length - 1] ?? 0;
  const growthPercent =
    lastMonth > 0 ? ((projected - lastMonth) / lastMonth) * 100 : 0;
  return { projected, growthPercent };
}

/**
 * Cancellation risk: clients expiring in 30 days + unpaid balance.
 */
export function getChurnRiskScore(
  daysUntilExpiry: number | null,
  hasUnpaidBalance: boolean
): "low" | "medium" | "high" {
  if (!daysUntilExpiry && !hasUnpaidBalance) return "low";
  if (daysUntilExpiry !== null && daysUntilExpiry <= 7) return "high";
  if (daysUntilExpiry !== null && daysUntilExpiry <= 30) return "medium";
  if (hasUnpaidBalance) return "medium";
  return "low";
}

export type DashboardInsightInput = {
  revenueThisMonth: number;
  revenueGrowthPercent: number;
  monthlyRevenue: number[];
  expiredClients: number;
  pendingPayments: number;
  activeClients: number;
};

/**
 * Generate 2-3 natural language insights for the dashboard.
 */
export function getDashboardInsights(input: DashboardInsightInput): string[] {
  const insights: string[] = [];

  if (input.monthlyRevenue.length >= 2) {
    const last = input.monthlyRevenue[input.monthlyRevenue.length - 1] ?? 0;
    const prev = input.monthlyRevenue[input.monthlyRevenue.length - 2] ?? 0;
    if (prev > 0 && last < prev * 0.85) {
      insights.push("Revenue dropped compared to the previous period. Consider promotions or follow-ups to boost collections.");
    } else if (input.revenueGrowthPercent > 0) {
      insights.push(`Revenue is up ${input.revenueGrowthPercent.toFixed(0)}% vs last month. Keep up the momentum.`);
    } else if (last > 0) {
      insights.push("Revenue trend is stable. Focus on retention and renewals to grow.");
    }
  }

  if (input.expiredClients > 0) {
    insights.push(`${input.expiredClients} subscription${input.expiredClients !== 1 ? "s have" : " has"} expired. Send reminders to recover revenue.`);
  }

  if (input.pendingPayments > 0) {
    insights.push("You have pending payments. Following up with clients can improve cash flow.");
  }

  if (insights.length === 0 && input.activeClients > 0) {
    insights.push("All looks good. Focus on retaining active members and attracting new ones.");
  }

  return insights.slice(0, 3);
}
