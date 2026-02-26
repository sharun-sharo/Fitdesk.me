import { NextResponse } from "next/server";
import { SubscriptionStatus } from "@prisma/client";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || ""; // ACTIVE | EXPIRED | ""

    const where: { gymId: string; fullName?: { contains: string; mode: "insensitive" }; subscriptionStatus?: SubscriptionStatus } = {
      gymId: session.gymId,
    };
    if (search) {
      where.fullName = { contains: search, mode: "insensitive" };
    }
    if (status === "ACTIVE") {
      where.subscriptionStatus = SubscriptionStatus.ACTIVE;
    } else if (status === "EXPIRED") {
      where.subscriptionStatus = SubscriptionStatus.EXPIRED;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          payments: { select: { amount: true } },
        },
      }),
      prisma.client.count({ where }),
    ]);

    const items = clients.map((c) => {
      const amountPaidFromPayments = c.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const totalAmount = Number(c.totalAmount);
      const pendingAmount = Math.max(0, totalAmount - amountPaidFromPayments);
      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        joinDate: c.joinDate.toISOString(),
        subscriptionStartDate: c.subscriptionStartDate?.toISOString() ?? null,
        subscriptionEndDate: c.subscriptionEndDate?.toISOString() ?? null,
        subscriptionStatus: c.subscriptionStatus,
        totalAmount,
        amountPaid: amountPaidFromPayments,
        pendingAmount,
      };
    });

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
