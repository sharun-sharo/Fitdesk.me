import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  subMonths,
  subDays,
  startOfWeek,
  endOfWeek,
  format,
} from "date-fns";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ActivityItem = {
  type: "new_client" | "payment_received" | "subscription_expired" | "invoice_generated";
  label: string;
  timestamp: string;
  id?: string;
};

export async function GET(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const gymId = session.gymId;

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const granularity = searchParams.get("granularity") || "monthly";

    const now = new Date();
    let rangeStart = subMonths(now, 5);
    let rangeEnd = now;
    if (fromParam) rangeStart = new Date(fromParam);
    if (toParam) rangeEnd = new Date(toParam);
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const thisYearStart = startOfYear(now);

    const [
      totalClients,
      activeClients,
      expiredClients,
      clientsThisMonth,
      clientsLastMonth,
      revenueThisMonthAgg,
      revenueLastMonthAgg,
      revenueThisYearAgg,
      pendingPaymentsAgg,
      last6MonthsRevenue,
      last6MonthsClientGrowth,
    ] = await Promise.all([
      prisma.client.count({ where: { gymId } }),
      prisma.client.count({
        where: { gymId, subscriptionStatus: "ACTIVE" },
      }),
      prisma.client.count({
        where: { gymId, subscriptionStatus: "EXPIRED" },
      }),
      prisma.client.count({
        where: {
          gymId,
          joinDate: { gte: thisMonthStart, lte: thisMonthEnd },
        },
      }),
      prisma.client.count({
        where: {
          gymId,
          joinDate: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      prisma.payment.aggregate({
        where: {
          client: { gymId },
          paymentDate: { gte: thisMonthStart, lte: thisMonthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          client: { gymId },
          paymentDate: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          client: { gymId },
          paymentDate: { gte: thisYearStart },
        },
        _sum: { amount: true },
      }),
      prisma.client.aggregate({
        where: { gymId },
        _sum: {
          totalAmount: true,
          amountPaid: true,
        },
      }),
      (async () => {
        const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
        return Promise.all(
          months.map(async (month) => {
            const start = startOfMonth(month);
            const end = endOfMonth(month);
            const agg = await prisma.payment.aggregate({
              where: {
                client: { gymId },
                paymentDate: { gte: start, lte: end },
              },
              _sum: { amount: true },
            });
            return {
              month: month.toLocaleString("default", { month: "short" }),
              revenue: Number(agg._sum.amount ?? 0),
            };
          })
        );
      })(),
      (async () => {
        const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
        return Promise.all(
          months.map(async (month) => {
            const end = endOfMonth(month);
            const count = await prisma.client.count({
              where: { gymId, joinDate: { lte: end } },
            });
            return {
              month: month.toLocaleString("default", { month: "short" }),
              clients: count,
            };
          })
        );
      })(),
    ]);

    const revenueThisMonth = Number(revenueThisMonthAgg._sum.amount ?? 0);
    const revenueLastMonth = Number(revenueLastMonthAgg._sum.amount ?? 0);
    const revenueThisYear = Number(revenueThisYearAgg._sum.amount ?? 0);
    const totalAmount = Number(pendingPaymentsAgg._sum.totalAmount ?? 0);
    const amountPaid = Number(pendingPaymentsAgg._sum.amountPaid ?? 0);
    const pendingPayments = Math.max(0, totalAmount - amountPaid);

    const revenueGrowthPercent =
      revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : revenueThisMonth > 0
        ? 100
        : 0;
    const clientGrowthPercent =
      clientsLastMonth > 0
        ? ((clientsThisMonth - clientsLastMonth) / clientsLastMonth) * 100
        : clientsThisMonth > 0
        ? 100
        : 0;

    const activeVsExpired: { name: string; value: number }[] = [];
    if (activeClients > 0) activeVsExpired.push({ name: "Active", value: activeClients });
    if (expiredClients > 0) activeVsExpired.push({ name: "Expired", value: expiredClients });
    const cancelledCount = await prisma.client.count({
      where: { gymId, subscriptionStatus: "CANCELLED" },
    });
    if (cancelledCount > 0) activeVsExpired.push({ name: "Cancelled", value: cancelledCount });

    const revenueInRange = await prisma.payment.aggregate({
      where: {
        client: { gymId },
        paymentDate: { gte: rangeStart, lte: rangeEnd },
      },
      _sum: { amount: true },
    });
    const revenueInRangeValue = Number(revenueInRange._sum.amount ?? 0);

    let chartRevenue: { month: string; revenue: number; periodStart: string; periodEnd: string }[];
    let chartGrowth: { month: string; clients: number }[];

    if (granularity === "weekly") {
      const weeks: { start: Date; end: Date }[] = [];
      let s = startOfWeek(rangeStart, { weekStartsOn: 1 });
      while (s <= rangeEnd) {
        const e = endOfWeek(s, { weekStartsOn: 1 });
        weeks.push({ start: s, end: e > rangeEnd ? rangeEnd : e });
        s = new Date(s.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      chartRevenue = await Promise.all(
        weeks.slice(-24).map(async (w) => {
          const agg = await prisma.payment.aggregate({
            where: {
              client: { gymId },
              paymentDate: { gte: w.start, lte: w.end },
            },
            _sum: { amount: true },
          });
          return {
            month: format(w.start, "d MMM"),
            revenue: Number(agg._sum.amount ?? 0),
            periodStart: w.start.toISOString(),
            periodEnd: w.end.toISOString(),
          };
        })
      );
      chartGrowth = await Promise.all(
        weeks.slice(-24).map(async (w) => {
          const count = await prisma.client.count({
            where: { gymId, joinDate: { lte: w.end } },
          });
          return { month: format(w.start, "d MMM"), clients: count };
        })
      );
    } else {
      const months: Date[] = [];
      let m = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
      while (m <= rangeEnd) {
        months.push(m);
        m = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      }
      chartRevenue = await Promise.all(
        months.slice(-12).map(async (month) => {
          const start = startOfMonth(month);
          const end = endOfMonth(month);
          const agg = await prisma.payment.aggregate({
            where: {
              client: { gymId },
              paymentDate: { gte: start, lte: end },
            },
            _sum: { amount: true },
          });
          return {
            month: month.toLocaleString("default", { month: "short" }),
            revenue: Number(agg._sum.amount ?? 0),
            periodStart: start.toISOString(),
            periodEnd: end.toISOString(),
          };
        })
      );
      chartGrowth = await Promise.all(
        months.slice(-12).map(async (month) => {
          const end = endOfMonth(month);
          const count = await prisma.client.count({
            where: { gymId, joinDate: { lte: end } },
          });
          return {
            month: month.toLocaleString("default", { month: "short" }),
            clients: count,
          };
        })
      );
    }

    const [recentClients, recentPayments, expiredClientsList] = await Promise.all([
      prisma.client.findMany({
        where: { gymId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, fullName: true, createdAt: true },
      }),
      prisma.payment.findMany({
        where: { client: { gymId } },
        orderBy: { paymentDate: "desc" },
        take: 5,
        include: { client: { select: { fullName: true } } },
      }),
      prisma.client.findMany({
        where: { gymId, subscriptionStatus: "EXPIRED", subscriptionEndDate: { not: null } },
        orderBy: { subscriptionEndDate: "desc" },
        take: 5,
        select: { id: true, fullName: true, subscriptionEndDate: true },
      }),
    ]);

    const activities: ActivityItem[] = [
      ...recentClients.map((c) => ({
        type: "new_client" as const,
        label: `${c.fullName} added`,
        timestamp: c.createdAt.toISOString(),
        id: c.id,
      })),
      ...recentPayments.map((p) => ({
        type: "payment_received" as const,
        label: `Payment received from ${p.client.fullName}`,
        timestamp: p.paymentDate.toISOString(),
        id: p.id,
      })),
      ...expiredClientsList.map((c) => ({
        type: "subscription_expired" as const,
        label: `${c.fullName}'s subscription expired`,
        timestamp: (c.subscriptionEndDate as Date).toISOString(),
        id: c.id,
      })),
    ];
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = activities.slice(0, 10);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoon = await prisma.client.findMany({
      where: {
        gymId,
        subscriptionStatus: "ACTIVE",
        subscriptionEndDate: {
          gte: startOfToday,
          lte: sevenDaysFromNow,
        },
      },
      orderBy: { subscriptionEndDate: "asc" },
      take: 20,
      select: { id: true, fullName: true, subscriptionEndDate: true },
    });

    return NextResponse.json({
      kpis: {
        totalClients,
        activeClients,
        expiredClients,
        revenueThisMonth,
        revenueThisYear,
        pendingPayments,
        revenueInRange: revenueInRangeValue,
        clientsThisMonth,
        clientsLastMonth,
        revenueGrowthPercent,
        clientGrowthPercent,
      },
      monthlyRevenue: chartRevenue,
      clientGrowth: chartGrowth,
      activeVsExpired,
      recentActivity,
      expiringSoon: expiringSoon.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        subscriptionEndDate: (c.subscriptionEndDate as Date).toISOString(),
      })),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
