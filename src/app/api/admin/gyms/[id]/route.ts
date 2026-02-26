import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    const data: { isActive?: boolean; subscriptionPlanId?: string | null; subscriptionStartDate?: Date | null; subscriptionEndDate?: Date | null; name?: string } = {};

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
    if (body.name !== undefined && typeof body.name === "string") {
      data.name = body.name.trim() || undefined;
    }

    const ownerUpdates: { name?: string; email?: string; phone?: string | null } = {};
    if (body.ownerName !== undefined && typeof body.ownerName === "string" && body.ownerName.trim()) {
      ownerUpdates.name = body.ownerName.trim();
    }
    if (body.ownerEmail !== undefined && typeof body.ownerEmail === "string") {
      ownerUpdates.email = body.ownerEmail.trim().toLowerCase();
    }
    if (body.ownerPhone !== undefined) {
      ownerUpdates.phone = typeof body.ownerPhone === "string" && body.ownerPhone.trim() ? body.ownerPhone.trim() : null;
    }

    if (Object.keys(data).length === 0 && Object.keys(ownerUpdates).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one of: isActive, subscriptionPlanId, subscriptionStartDate, subscriptionEndDate, name, ownerName, ownerEmail, ownerPhone" },
        { status: 400 }
      );
    }

    const gym = await prisma.gym.findUnique({ where: { id }, select: { ownerId: true } });
    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    if (Object.keys(data).length > 0) {
      await prisma.gym.update({ where: { id }, data });
    }
    if (Object.keys(ownerUpdates).length > 0 && gym.ownerId) {
      if (ownerUpdates.email) {
        const existing = await prisma.user.findFirst({
          where: { email: ownerUpdates.email, id: { not: gym.ownerId } },
        });
        if (existing) {
          return NextResponse.json({ error: "Another user already has this email" }, { status: 400 });
        }
      }
      await prisma.user.update({
        where: { id: gym.ownerId },
        data: ownerUpdates,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
