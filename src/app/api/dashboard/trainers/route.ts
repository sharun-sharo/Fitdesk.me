import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrainerShift, TrainerSalaryType } from "@prisma/client";

export const dynamic = "force-dynamic";

const SHIFT_VALUES = ["MORNING", "EVENING", "CUSTOM"] as const;
const SALARY_VALUES = ["FIXED", "PER_SESSION"] as const;

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

export async function GET(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const shiftFilter = searchParams.get("shift")?.toUpperCase();
    const specFilter = searchParams.get("specialization")?.trim();
    const statusTodayFilter = searchParams.get("statusToday")?.toLowerCase(); // present | absent
    const sort = searchParams.get("sort") || "name"; // name | joinDate | attendance

    const where: { gymId: string; fullName?: { contains: string; mode: "insensitive" }; shift?: TrainerShift; specialization?: string | null } = {
      gymId: session.gymId,
    };
    if (search) where.fullName = { contains: search, mode: "insensitive" };
    if (shiftFilter && SHIFT_VALUES.includes(shiftFilter as any)) where.shift = shiftFilter as TrainerShift;
    if (specFilter) where.specialization = specFilter;

    let trainers = await prisma.trainer.findMany({
      where,
      orderBy: sort === "joinDate" ? { joiningDate: "desc" } : { fullName: "asc" },
      include: {
        _count: { select: { attendance: true } },
      },
    });

    const trainerIds = trainers.map((t) => t.id);
    const today = startOfDay(new Date());
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthStart = startOfDay(startOfMonth);
    const monthEnd = startOfDay(endOfMonth);

    const [todayRecords, monthRecords] = await Promise.all([
      trainerIds.length > 0
        ? prisma.trainerAttendance.findMany({
            where: { trainerId: { in: trainerIds }, date: today },
            select: { trainerId: true, status: true },
          })
        : [],
      trainerIds.length > 0
        ? prisma.trainerAttendance.findMany({
            where: {
              trainerId: { in: trainerIds },
              date: { gte: monthStart, lte: monthEnd },
            },
            select: { trainerId: true, status: true },
          })
        : [],
    ]);

    const todayByTrainer: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
    todayRecords.forEach((r) => {
      todayByTrainer[r.trainerId] = r.status;
    });
    const monthByTrainer: Record<string, { present: number; absent: number; late: number }> = {};
    trainerIds.forEach((id) => {
      monthByTrainer[id] = { present: 0, absent: 0, late: 0 };
    });
    monthRecords.forEach((r) => {
      const m = monthByTrainer[r.trainerId];
      if (m) {
        if (r.status === "PRESENT") m.present++;
        else if (r.status === "ABSENT") m.absent++;
        else m.late++;
      }
    });

    if (statusTodayFilter === "present") {
      trainers = trainers.filter((t) => todayByTrainer[t.id] === "PRESENT" || todayByTrainer[t.id] === "LATE");
    } else if (statusTodayFilter === "absent") {
      trainers = trainers.filter((t) => todayByTrainer[t.id] === "ABSENT");
    }

    const withMeta = trainers.map((t) => {
      const todayStatus = todayByTrainer[t.id] ?? null;
      const month = monthByTrainer[t.id] ?? { present: 0, absent: 0, late: 0 };
      const total = month.present + month.absent + month.late;
      const percent = total > 0 ? Math.round(((month.present + month.late) / total) * 100) : 0;
      return {
        id: t.id,
        fullName: t.fullName,
        phone: t.phone,
        email: t.email,
        specialization: t.specialization,
        shift: t.shift,
        shiftCustom: t.shiftCustom,
        weeklyOff: t.weeklyOff as string[] | null,
        salaryType: t.salaryType,
        joiningDate: t.joiningDate?.toISOString().slice(0, 10) ?? null,
        profilePhoto: t.profilePhoto,
        createdAt: t.createdAt.toISOString(),
        attendanceCount: t._count.attendance,
        todayStatus,
        monthSummary: {
          present: month.present,
          absent: month.absent,
          late: month.late,
          percent,
        },
      };
    });

    if (sort === "attendance") {
      withMeta.sort((a, b) => (b.monthSummary.percent ?? 0) - (a.monthSummary.percent ?? 0));
    }

    return NextResponse.json({ trainers: withMeta });
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
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    if (!fullName) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }
    const shift = SHIFT_VALUES.includes(body.shift) ? body.shift : "MORNING";
    const salaryType = SALARY_VALUES.includes(body.salaryType) ? body.salaryType : "FIXED";
    const weeklyOff = Array.isArray(body.weeklyOff) ? body.weeklyOff : null;
    const joiningDate = typeof body.joiningDate === "string" && body.joiningDate ? new Date(body.joiningDate) : null;

    const trainer = await prisma.trainer.create({
      data: {
        gymId: session.gymId,
        fullName,
        phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
        email: typeof body.email === "string" ? body.email.trim() || null : null,
        specialization: typeof body.specialization === "string" ? body.specialization.trim() || null : null,
        shift: shift as TrainerShift,
        shiftCustom: typeof body.shiftCustom === "string" ? body.shiftCustom.trim() || null : null,
        weeklyOff: weeklyOff ?? undefined,
        salaryType: salaryType as TrainerSalaryType,
        joiningDate,
        profilePhoto: typeof body.profilePhoto === "string" ? body.profilePhoto.trim() || null : null,
      },
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
