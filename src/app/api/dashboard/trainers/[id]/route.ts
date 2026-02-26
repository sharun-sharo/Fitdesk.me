import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SHIFT_VALUES = ["MORNING", "EVENING", "CUSTOM"] as const;
const SALARY_VALUES = ["FIXED", "PER_SESSION"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const existing = await prisma.trainer.findFirst({
      where: { id, gymId: session.gymId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof body.fullName === "string" && body.fullName.trim()) data.fullName = body.fullName.trim();
    if (body.phone !== undefined) data.phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
    if (body.email !== undefined) data.email = typeof body.email === "string" ? body.email.trim() || null : null;
    if (body.specialization !== undefined) data.specialization = typeof body.specialization === "string" ? body.specialization.trim() || null : null;
    if (SHIFT_VALUES.includes(body.shift)) data.shift = body.shift;
    if (body.shiftCustom !== undefined) data.shiftCustom = typeof body.shiftCustom === "string" ? body.shiftCustom.trim() || null : null;
    if (Array.isArray(body.weeklyOff)) data.weeklyOff = body.weeklyOff;
    if (SALARY_VALUES.includes(body.salaryType)) data.salaryType = body.salaryType;
    if (body.joiningDate !== undefined) data.joiningDate = body.joiningDate ? new Date(body.joiningDate) : null;
    if (body.profilePhoto !== undefined) data.profilePhoto = typeof body.profilePhoto === "string" ? body.profilePhoto.trim() || null : null;

    const trainer = await prisma.trainer.update({
      where: { id },
      data: data as any,
    });
    return NextResponse.json({
      id: trainer.id,
      fullName: trainer.fullName,
      phone: trainer.phone,
      email: trainer.email,
      specialization: trainer.specialization,
      shift: trainer.shift,
      shiftCustom: trainer.shiftCustom,
      weeklyOff: trainer.weeklyOff,
      salaryType: trainer.salaryType,
      joiningDate: trainer.joiningDate?.toISOString().slice(0, 10) ?? null,
      profilePhoto: trainer.profilePhoto,
      createdAt: trainer.createdAt.toISOString(),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const existing = await prisma.trainer.findFirst({
      where: { id, gymId: session.gymId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }
    await prisma.trainer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
