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

/**
 * Risk score 0–100% for display. Uses expiry proximity and payment delay.
 */
export function getChurnRiskPercent(
  daysUntilExpiry: number | null,
  hasUnpaidBalance: boolean,
  lastPaymentDaysAgo: number | null
): number {
  let score = 0;
  if (daysUntilExpiry !== null) {
    if (daysUntilExpiry <= 0) score = 95;
    else if (daysUntilExpiry <= 7) score = 75 + (7 - daysUntilExpiry) * 3;
    else if (daysUntilExpiry <= 30) score = 40 + (30 - daysUntilExpiry) * 1.2;
    else if (daysUntilExpiry <= 60) score = 20 + (60 - daysUntilExpiry) * 0.4;
    else score = Math.max(0, 15 - daysUntilExpiry * 0.1);
  }
  if (hasUnpaidBalance) score = Math.min(100, score + 25);
  if (lastPaymentDaysAgo !== null && lastPaymentDaysAgo > 30) score = Math.min(100, score + 15);
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Human-readable reason for churn risk (for tooltips and list).
 */
export function getChurnRiskReason(
  daysUntilExpiry: number | null,
  hasUnpaidBalance: boolean,
  lastPaymentDaysAgo: number | null
): string {
  const parts: string[] = [];
  if (daysUntilExpiry !== null) {
    if (daysUntilExpiry <= 0) parts.push("Subscription expired");
    else if (daysUntilExpiry <= 7) parts.push(`Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`);
    else if (daysUntilExpiry <= 30) parts.push(`Expiring in ${daysUntilExpiry} days`);
  }
  if (hasUnpaidBalance) parts.push("Payment overdue");
  if (lastPaymentDaysAgo !== null && lastPaymentDaysAgo > 30) parts.push("No payment in 30+ days");
  if (parts.length === 0) return "Low engagement";
  return parts.join(" · ");
}

export type RecommendedAction = {
  id: string;
  label: string;
  count: number;
  type: "send_reminder" | "follow_up_payment" | "offer_discount";
  clientIds: string[];
  sublabel?: string;
  clientsPreview?: { id: string; name: string; meta?: string }[];
};

/**
 * Build recommended actions from high-risk and unpaid clients.
 */
export function getRecommendedActions(
  highRiskClients: { id: string; fullName: string; riskPercent: number }[],
  unpaidClients: { id: string; fullName: string }[],
  _expiringSoonCount: number
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const reminderCandidates = highRiskClients.filter((c) => c.riskPercent >= 50).slice(0, 10);
  if (reminderCandidates.length > 0) {
    const preview = reminderCandidates.slice(0, 3).map((c) => ({
      id: c.id,
      name: c.fullName,
      meta: `${c.riskPercent}% risk`,
    }));
    actions.push({
      id: "send_reminder",
      label: "Send renewal reminder",
      count: reminderCandidates.length,
      type: "send_reminder",
      clientIds: reminderCandidates.map((c) => c.id),
      sublabel: `${reminderCandidates.length} high-risk client${reminderCandidates.length !== 1 ? "s" : ""}`,
      clientsPreview: preview,
    });
  }
  const unpaidIds = unpaidClients.map((c) => c.id);
  if (unpaidIds.length > 0) {
    const preview = unpaidClients.slice(0, 3).map((c) => ({
      id: c.id,
      name: c.fullName,
    }));
    actions.push({
      id: "follow_up_payment",
      label: "Follow up on unpaid subscriptions",
      count: unpaidIds.length,
      type: "follow_up_payment",
      clientIds: unpaidIds,
      sublabel: `${unpaidIds.length} client${unpaidIds.length !== 1 ? "s" : ""} with pending dues`,
      clientsPreview: preview,
    });
  }
  const discountCandidates = highRiskClients.filter((c) => c.riskPercent >= 70).slice(0, 5);
  if (discountCandidates.length > 0) {
    const preview = discountCandidates.slice(0, 3).map((c) => ({
      id: c.id,
      name: c.fullName,
      meta: `${c.riskPercent}% risk`,
    }));
    actions.push({
      id: "offer_discount",
      label: "Offer discount to high churn risk",
      count: discountCandidates.length,
      type: "offer_discount",
      clientIds: discountCandidates.map((c) => c.id),
      sublabel: `${discountCandidates.length} client${discountCandidates.length !== 1 ? "s" : ""} (e.g. ${discountCandidates[0]?.fullName ?? ""})`,
      clientsPreview: preview,
    });
  }
  return actions;
}

/**
 * AI commentary for revenue card (sparkline context).
 */
export function getRevenueCommentary(
  projectedRevenue: number,
  growthPercent: number,
  revenueAtRisk: number,
  pendingRenewalsCount: number
): string {
  if (revenueAtRisk > 0 && pendingRenewalsCount > 0) {
    return `Revenue likely to remain flat unless ${pendingRenewalsCount} pending renewal${pendingRenewalsCount !== 1 ? "s" : ""} convert. ₹${revenueAtRisk.toLocaleString("en-IN")} at risk if they churn.`;
  }
  if (growthPercent > 5) {
    return "Revenue trend is positive. Keep focusing on retention and new sign-ups.";
  }
  if (growthPercent < -10) {
    return "Revenue is declining. Consider follow-ups and offers to recover at-risk clients.";
  }
  return "Revenue trend is stable. Focus on converting expiring clients to retain growth.";
}

/**
 * Benchmark-style message for renewal rate.
 */
export function getBenchmarkMessage(renewalRatePercent: number): string {
  const avg = 78;
  if (renewalRatePercent >= 90) return "You're performing well above average. Keep it up.";
  if (renewalRatePercent >= avg) return "You're performing above average.";
  if (renewalRatePercent >= 60) return "There's room to improve. Focus on renewal follow-ups.";
  return "Renewal rate is low. Prioritise reminders and offers for expiring clients.";
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
