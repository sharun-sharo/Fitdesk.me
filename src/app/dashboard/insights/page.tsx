import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import { InsightsCards } from "./insights-cards";

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

  const { projectNextMonth, getChurnRiskScore } = await import("@/lib/ai-insights");
  const { projected, growthPercent } = projectNextMonth(monthlyRevenue);

  const activeClients = await prisma.client.findMany({
    where: { gymId: session.gymId, subscriptionStatus: "ACTIVE" },
    select: {
      id: true,
      fullName: true,
      subscriptionEndDate: true,
      totalAmount: true,
      amountPaid: true,
    },
  });

  const expiringIn30Days = activeClients.filter((c) => {
    if (!c.subscriptionEndDate) return false;
    const end = new Date(c.subscriptionEndDate);
    const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  const churnRiskClients = activeClients
    .map((c) => {
      const end = c.subscriptionEndDate;
      const daysUntil =
        end != null
          ? Math.ceil(
              (new Date(end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
          : null;
      const pending = Number(c.totalAmount) - Number(c.amountPaid) > 0;
      const risk = getChurnRiskScore(daysUntil, pending);
      return { ...c, daysUntil, risk };
    })
    .filter((c) => c.risk !== "low");

  const expectedRenewals = expiringIn30Days.length;
  const renewalRatePercent =
    expiringIn30Days.length > 0
      ? Math.min(100, Math.round((expectedRenewals / expiringIn30Days.length) * 85))
      : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground mt-1">
          Revenue projections and cancellation risk (based on past data)
        </p>
      </div>
      <InsightsCards
        projectedRevenue={projected}
        growthPercent={growthPercent}
        expectedRenewals={expectedRenewals}
        churnRiskCount={churnRiskClients.length}
        renewalRatePercent={renewalRatePercent}
        churnRiskClients={churnRiskClients.map((c) => ({
          id: c.id,
          fullName: c.fullName,
          risk: c.risk,
          daysUntil: c.daysUntil,
        }))}
      />
    </div>
  );
}
