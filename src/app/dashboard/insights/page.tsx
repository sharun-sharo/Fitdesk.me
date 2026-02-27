import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import { getEffectiveSubscriptionStatus } from "@/lib/utils";
import {
  projectNextMonth,
  getChurnRiskScore,
  getChurnRiskPercent,
  getChurnRiskReason,
  getRecommendedActions,
  getRevenueCommentary,
  getBenchmarkMessage,
} from "@/lib/ai-insights";
import { InsightsCards } from "./insights-cards";
import { RecommendedActionsSection } from "./recommended-actions-section";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const session = await getSession();
  if (!session?.gymId) return null;

  const now = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));

  const monthlyRevenue: number[] = [];
  for (const month of last6Months) {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const agg = await prisma.payment.aggregate({
      where: {
        client: { gymId: session.gymId },
        paymentDate: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });
    monthlyRevenue.push(Number(agg._sum.amount ?? 0));
  }

  const { projected, growthPercent } = projectNextMonth(monthlyRevenue);

  const clientsWithPayments = await prisma.client.findMany({
    where: { gymId: session.gymId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      subscriptionStatus: true,
      subscriptionEndDate: true,
      totalAmount: true,
      amountPaid: true,
      payments: {
        select: { paymentDate: true },
        orderBy: { paymentDate: "desc" },
        take: 1,
      },
    },
  });

  const activeClients = clientsWithPayments.filter(
    (c) => getEffectiveSubscriptionStatus(c.subscriptionStatus, c.subscriptionEndDate?.toISOString() ?? null) === "ACTIVE"
  );

  const expiringIn30Days = activeClients.filter((c) => {
    if (!c.subscriptionEndDate) return false;
    const end = new Date(c.subscriptionEndDate);
    const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  type RiskClient = {
    id: string;
    fullName: string;
    phone: string | null;
    risk: "low" | "medium" | "high";
    riskPercent: number;
    riskReason: string;
    daysUntil: number | null;
    pendingAmount: number;
    subscriptionEndDate: Date | null;
    totalAmount: number;
  };

  const churnRiskClients: RiskClient[] = activeClients
    .map((c) => {
      const end = c.subscriptionEndDate;
      const daysUntil =
        end != null
          ? Math.ceil((new Date(end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;
      const pending = Number(c.totalAmount) - Number(c.amountPaid) > 0;
      const lastPayment = c.payments[0]?.paymentDate;
      const lastPaymentDaysAgo =
        lastPayment != null
          ? Math.ceil((now.getTime() - new Date(lastPayment).getTime()) / (1000 * 60 * 60 * 24))
          : null;
      const riskPercent = getChurnRiskPercent(daysUntil, pending, lastPaymentDaysAgo);
      const risk = getChurnRiskScore(daysUntil, pending);
      const riskReason = getChurnRiskReason(daysUntil, pending, lastPaymentDaysAgo);
      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        risk,
        riskPercent,
        riskReason,
        daysUntil,
        pendingAmount: Math.max(0, Number(c.totalAmount) - Number(c.amountPaid)),
        subscriptionEndDate: c.subscriptionEndDate,
        totalAmount: Number(c.totalAmount),
      };
    })
    .filter((c) => c.risk !== "low");

  const unpaidClients = clientsWithPayments
    .filter((c) => Number(c.totalAmount) - Number(c.amountPaid) > 0)
    .map((c) => ({ id: c.id, fullName: c.fullName }));

  const recommendedActions = getRecommendedActions(
    churnRiskClients.map((c) => ({ id: c.id, fullName: c.fullName, riskPercent: c.riskPercent })),
    unpaidClients,
    expiringIn30Days.length
  );

  const revenueAtRisk = expiringIn30Days.reduce(
    (sum, c) => sum + Number(c.totalAmount),
    0
  );
  const renewalRatePercent =
    activeClients.length > 0
      ? Math.min(100, Math.round((expiringIn30Days.length / Math.max(1, activeClients.length)) * 100 * 0.85))
      : 0;
  const revenueCommentary = getRevenueCommentary(
    projected,
    growthPercent,
    revenueAtRisk,
    expiringIn30Days.length
  );
  const benchmarkMessage = getBenchmarkMessage(renewalRatePercent);

  const whatIfNewRate = 92;
  const whatIfIncrease = Math.round(revenueAtRisk * ((whatIfNewRate - renewalRatePercent) / 100));

  const expectedRenewalsDetail = expiringIn30Days.map((c) => {
    const riskClient = churnRiskClients.find((r) => r.id === c.id);
    const pending = Math.max(0, Number(c.totalAmount) - Number(c.amountPaid));
    return {
      id: c.id,
      fullName: c.fullName,
      planAmount: Number(c.totalAmount),
      revenueImpact: Number(c.totalAmount),
      pendingAmount: pending,
      riskPercent: riskClient?.riskPercent ?? 0,
      riskReason: riskClient?.riskReason ?? "Expiring soon",
    };
  });

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Growth & Retention Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          Revenue projections, cancellation risk, and recommended actions—turned into revenue-driving behavior
        </p>
      </div>

      <RecommendedActionsSection actions={recommendedActions} />

      <InsightsCards
        monthlyRevenue={monthlyRevenue}
        projectedRevenue={projected}
        growthPercent={growthPercent}
        expectedRenewals={expiringIn30Days.length}
        churnRiskCount={churnRiskClients.length}
        renewalRatePercent={renewalRatePercent}
        revenueAtRisk={revenueAtRisk}
        revenueCommentary={revenueCommentary}
        benchmarkMessage={benchmarkMessage}
        churnRiskClients={churnRiskClients}
        expectedRenewalsDetail={expectedRenewalsDetail}
        whatIfIncrease={whatIfIncrease}
        whatIfNewRate={whatIfNewRate}
      />
    </div>
  );
}
