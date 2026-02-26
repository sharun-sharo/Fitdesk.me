import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const data: { isActive?: boolean; subscriptionPlanId?: string | null; subscriptionStartDate?: Date | null; subscriptionEndDate?: Date | null } = {};

    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (body.subscriptionPlanId !== undefined) {
      data.subscriptionPlanId = body.subscriptionPlanId ? String(body.subscriptionPlanId) : null;
    }
    if (body.subscriptionStartDate !== undefined) {
      data.subscriptionStartDate = body.subscriptionStartDate ? new Date(body.subscriptionStartDate) : null;
    }
    if (body.subscriptionEndDate !== undefined) {
      data.subscriptionEndDate = body.subscriptionEndDate ? new Date(body.subscriptionEndDate) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one of: isActive, subscriptionPlanId, subscriptionStartDate, subscriptionEndDate" },
        { status: 400 }
      );
    }

    await prisma.gym.update({
      where: { id },
      data,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
