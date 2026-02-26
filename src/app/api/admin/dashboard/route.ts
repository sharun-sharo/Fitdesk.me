import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const expiringEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalGyms,
      activeGyms,
      expiringIn30,
      gymsThisMonth,
      gymsLastMonth,
      plansWithGyms,
      allGymsForRevenue,
    ] = await Promise.all([
      prisma.gym.count(),
      prisma.gym.count({ where: { isActive: true } }),
      prisma.gym.count({
        where: {
          subscriptionEndDate: { gte: now, lte: expiringEnd },
          isActive: true,
        },
      }),
      prisma.gym.count({
        where: { createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
      }),
      prisma.gym.count({
        where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      prisma.subscriptionPlan.findMany({
        include: {
          gyms: {
            where: {
              subscriptionStartDate: { lte: thisMonthEnd },
              subscriptionEndDate: { gte: thisMonthStart },
              isActive: true,
            },
          },
        },
      }),
      prisma.gym.findMany({
        where: { isActive: true },
        include: { subscriptionPlan: true },
      }),
    ]);

    const mrr = plansWithGyms.reduce((sum, plan) => {
      return sum + Number(plan.price) * plan.gyms.length;
    }, 0);

    const growthGyms =
      gymsLastMonth > 0
        ? ((gymsThisMonth - gymsLastMonth) / gymsLastMonth) * 100
        : gymsThisMonth > 0
        ? 100
        : 0;

    const last12Months = Array.from({ length: 12 }, (_, i) =>
      subMonths(now, 11 - i)
    );
    const revenueByMonth = await Promise.all(
      last12Months.map(async (month) => {
        const start = startOfMonth(month);
        const end = endOfMonth(month);
        const gymsInRange = allGymsForRevenue.filter(
          (g) =>
            g.subscriptionStartDate &&
            g.subscriptionEndDate &&
            g.subscriptionStartDate <= end &&
            g.subscriptionEndDate >= start
        );
        const rev = gymsInRange.reduce(
          (s, g) => s + (g.subscriptionPlan ? Number(g.subscriptionPlan.price) : 0),
          0
        );
        return {
          month: month.toLocaleString("default", { month: "short", year: "2-digit" }),
          revenue: rev,
        };
      })
    );

    const gymsByMonth = await Promise.all(
      last12Months.map(async (month) => {
        const start = startOfMonth(month);
        const end = endOfMonth(month);
        const count = await prisma.gym.count({
          where: { createdAt: { gte: start, lte: end } },
        });
        return {
          month: month.toLocaleString("default", { month: "short" }),
          gyms: count,
        };
      })
    );

    const subscriptionDistribution = plansWithGyms.map((plan) => ({
      name: plan.name,
      value: plan.gyms.length,
    }));

    const lifetimeRevenue = allGymsForRevenue.reduce((sum, g) => {
      if (!g.subscriptionPlan) return sum;
      const price = Number(g.subscriptionPlan.price);
      const start = g.subscriptionStartDate ? new Date(g.subscriptionStartDate) : null;
      const end = g.subscriptionEndDate ? new Date(g.subscriptionEndDate) : null;
      if (!start || !end) return sum;
      const months = Math.max(0, (end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
      return sum + price * Math.ceil(months);
    }, 0);

    const activities: { type: string; label: string; time: string; color: string }[] = [];
    const recentGyms = await prisma.gym.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { name: true } } },
    });
    recentGyms.forEach((g) => {
      activities.push({
        type: "gym_registered",
        label: `${g.owner.name} registered ${g.name}`,
        time: g.createdAt.toISOString(),
        color: "emerald",
      });
    });
    const recentPlans = await prisma.subscriptionPlan.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
    });
    recentPlans.forEach((p) => {
      activities.push({
        type: "plan_created",
        label: `Plan "${p.name}" created`,
        time: p.createdAt.toISOString(),
        color: "blue",
      });
    });
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const recentActivity = activities.slice(0, 10);

    return NextResponse.json({
      kpis: {
        totalGymOwners: totalGyms,
        activeGyms,
        mrr,
        expiringIn30Days: expiringIn30,
        growthPercent: Math.round(growthGyms * 10) / 10,
      },
      revenueOverTime: revenueByMonth,
      gymGrowth: gymsByMonth,
      subscriptionDistribution,
      lifetimeRevenue,
      recentActivity,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
