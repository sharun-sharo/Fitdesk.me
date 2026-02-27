import { NextResponse } from "next/server";
import { SubscriptionStatus } from "@prisma/client";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveSubscriptionStatus } from "@/lib/utils";

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
    const status = searchParams.get("status") || ""; // ACTIVE | EXPIRED | EXPIRING_SOON | ""

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    type Where = {
      gymId: string;
      fullName?: { contains: string; mode: "insensitive" };
      phone?: { contains: string };
      email?: { contains: string; mode: "insensitive" };
      subscriptionStatus?: SubscriptionStatus;
      subscriptionEndDate?: { not: null; gte?: Date; lte?: Date; lt?: Date } | null;
      OR?: Array<Record<string, unknown>>;
      AND?: Array<Record<string, unknown>>;
    };
    const where: Where = { gymId: session.gymId };
    const andConditions: Record<string, unknown>[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }
    if (status === "ACTIVE") {
      where.subscriptionStatus = SubscriptionStatus.ACTIVE;
      andConditions.push({
        OR: [
          { subscriptionEndDate: null },
          { subscriptionEndDate: { gte: startOfToday } },
        ],
      });
    } else if (status === "EXPIRING_SOON") {
      where.subscriptionStatus = SubscriptionStatus.ACTIVE;
      where.subscriptionEndDate = {
        not: null,
        gte: now,
        lte: sevenDaysFromNow,
      };
    } else if (status === "EXPIRED") {
      andConditions.push({
        OR: [
          { subscriptionStatus: SubscriptionStatus.EXPIRED },
          { subscriptionEndDate: null },
          { subscriptionEndDate: { lt: startOfToday } },
        ],
      });
    }
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          payments: { select: { amount: true, paymentDate: true }, orderBy: { paymentDate: "desc" } },
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
      const lastPayment = c.payments[0];
      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        joinDate: c.joinDate.toISOString(),
        subscriptionStartDate: c.subscriptionStartDate?.toISOString() ?? null,
        subscriptionEndDate: c.subscriptionEndDate?.toISOString() ?? null,
        subscriptionStatus: getEffectiveSubscriptionStatus(
          c.subscriptionStatus,
          c.subscriptionEndDate?.toISOString() ?? null
        ),
        totalAmount,
        amountPaid: amountPaidFromPayments,
        pendingAmount,
        lastPaymentDate: lastPayment?.paymentDate?.toISOString() ?? null,
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
    console.error("GET /api/dashboard/clients error:", e);
    const isPrismaError =
      e instanceof Error &&
      (e.message.includes("column") ||
        e.message.includes("Unknown arg") ||
        e.message.includes("Invalid `prisma"));
    const message =
      process.env.NODE_ENV === "development" && e instanceof Error
        ? e.message
        : isPrismaError
          ? "Database schema out of date. Run: npx prisma migrate deploy"
          : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
