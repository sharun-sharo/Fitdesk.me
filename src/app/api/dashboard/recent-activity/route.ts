import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ActivityItem = {
  type: "new_client" | "payment_received" | "subscription_expired" | "invoice_generated";
  label: string;
  timestamp: string;
  id?: string;
};

export async function GET() {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const gymId = session.gymId;

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

    return NextResponse.json({ recentActivity });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
