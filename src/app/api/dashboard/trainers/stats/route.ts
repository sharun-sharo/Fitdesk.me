import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

export async function GET() {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const today = startOfDay(new Date());
    const trainerIds = await prisma.trainer.findMany({
      where: { gymId: session.gymId },
      select: { id: true },
    }).then((rows) => rows.map((r) => r.id));
    const totalTrainers = trainerIds.length;
    if (totalTrainers === 0) {
      return NextResponse.json({
        totalTrainers: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        attendancePercent: 0,
      });
    }
    const todayRecords = await prisma.trainerAttendance.findMany({
      where: { trainerId: { in: trainerIds }, date: today },
      select: { status: true },
    });
    const presentToday = todayRecords.filter((r) => r.status === "PRESENT").length;
    const absentToday = todayRecords.filter((r) => r.status === "ABSENT").length;
    const lateToday = todayRecords.filter((r) => r.status === "LATE").length;
    const markedCount = todayRecords.length;
    const attendancePercent =
      totalTrainers > 0 ? Math.round((presentToday + lateToday) / totalTrainers * 100) : 0;
    return NextResponse.json({
      totalTrainers,
      presentToday,
      absentToday,
      lateToday,
      attendancePercent,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
