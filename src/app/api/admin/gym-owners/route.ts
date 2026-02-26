import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || ""; // active | inactive
    const planId = searchParams.get("planId") || "";

    type Where = {
      isActive?: boolean;
      subscriptionPlanId?: string | null;
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; owner?: { name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } } }>;
    };
    const where: Where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { owner: { name: { contains: search, mode: "insensitive" } } },
        { owner: { email: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (planId) where.subscriptionPlanId = planId;
    const cleanWhere = Object.keys(where).length ? where : undefined;

    const [gyms, total] = await Promise.all([
      prisma.gym.findMany({
        where: cleanWhere,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          subscriptionPlan: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.gym.count({
        where: cleanWhere,
      }),
    ]);

    const items = gyms.map((g) => ({
      id: g.id,
      name: g.name,
      ownerName: g.owner.name,
      ownerEmail: g.owner.email,
      ownerId: g.owner.id,
      planName: g.subscriptionPlan?.name ?? "—",
      planId: g.subscriptionPlanId ?? null,
      planPrice: g.subscriptionPlan ? Number(g.subscriptionPlan.price) : null,
      subscriptionEndDate: g.subscriptionEndDate?.toISOString() ?? null,
      isActive: g.isActive,
    }));

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

export async function POST(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = body.name?.trim();
    const email = body.email?.trim()?.toLowerCase();
    const password = body.password;
    const gymName = body.gymName?.trim();
    const subscriptionPlanId = body.subscriptionPlanId?.trim() || null;
    const durationDays = body.durationDays != null ? Number(body.durationDays) : 30;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Owner name and email are required" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password is required (min 6 characters)" },
        { status: 400 }
      );
    }
    if (!gymName) {
      return NextResponse.json(
        { error: "Gym name is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const now = new Date();
    const subscriptionEndDate = subscriptionPlanId
      ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "GYM_OWNER",
      },
    });

    const gym = await prisma.gym.create({
      data: {
        name: gymName,
        ownerId: user.id,
        subscriptionPlanId: subscriptionPlanId || undefined,
        subscriptionStartDate: subscriptionPlanId ? now : undefined,
        subscriptionEndDate: subscriptionEndDate ?? undefined,
        isActive: true,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { gymId: gym.id },
    });

    return NextResponse.json({
      id: gym.id,
      name: gym.name,
      ownerId: user.id,
      ownerName: user.name,
      ownerEmail: user.email,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
