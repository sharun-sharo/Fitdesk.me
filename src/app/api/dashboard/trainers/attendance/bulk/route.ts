import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

export async function POST(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const dateStr = typeof body.date === "string" ? body.date : null;
    const trainerIds = Array.isArray(body.trainerIds) ? body.trainerIds.filter((id) => typeof id === "string") as string[] : [];
    if (!dateStr || trainerIds.length === 0) {
      return NextResponse.json({ error: "Date and trainerIds required" }, { status: 400 });
    }
    const date = startOfDay(new Date(dateStr));
    const allowed = await prisma.trainer.findMany({
      where: { id: { in: trainerIds }, gymId: session.gymId },
      select: { id: true },
    });
    const ids = allowed.map((t) => t.id);
    await Promise.all(
      ids.map((trainerId) =>
        prisma.trainerAttendance.upsert({
          where: { trainerId_date: { trainerId, date } },
          create: { trainerId, date, status: "PRESENT" },
          update: { status: "PRESENT" },
        })
      )
    );
    return NextResponse.json({ ok: true, count: ids.length });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
