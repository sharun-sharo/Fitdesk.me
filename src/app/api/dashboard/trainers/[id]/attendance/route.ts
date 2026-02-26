import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

const STATUS_VALUES = ["PRESENT", "ABSENT", "LATE"] as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const trainer = await prisma.trainer.findFirst({
      where: { id, gymId: session.gymId },
    });
    if (!trainer) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const from = fromParam ? startOfDay(new Date(fromParam)) : startOfDay(new Date());
    const to = toParam ? startOfDay(new Date(toParam)) : from;
    const start = from <= to ? from : to;
    const end = from <= to ? to : from;

    const records = await prisma.trainerAttendance.findMany({
      where: {
        trainerId: id,
        date: { gte: start, lte: end },
      },
      orderBy: { date: "asc" },
    });
    return NextResponse.json({
      attendance: records.map((r) => ({
        id: r.id,
        date: r.date.toISOString().slice(0, 10),
        status: r.status,
        checkInTime: r.checkInTime?.toISOString() ?? null,
        checkOutTime: r.checkOutTime?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const trainer = await prisma.trainer.findFirst({
      where: { id, gymId: session.gymId },
    });
    if (!trainer) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }
    const body = await request.json();
    const dateStr = typeof body.date === "string" ? body.date : null;
    if (!dateStr) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    const date = startOfDay(new Date(dateStr));
    let status: AttendanceStatus = "PRESENT";
    if (STATUS_VALUES.includes(body.status)) {
      status = body.status as AttendanceStatus;
    } else if (body.present === false) {
      status = "ABSENT";
    }
    const checkInTime = body.checkInTime ? new Date(body.checkInTime) : null;
    const checkOutTime = body.checkOutTime ? new Date(body.checkOutTime) : null;

    const record = await prisma.trainerAttendance.upsert({
      where: {
        trainerId_date: { trainerId: id, date },
      },
      create: { trainerId: id, date, status, checkInTime, checkOutTime },
      update: { status, checkInTime: checkInTime ?? undefined, checkOutTime: checkOutTime ?? undefined },
    });
    return NextResponse.json({
      id: record.id,
      date: record.date.toISOString().slice(0, 10),
      status: record.status,
      checkInTime: record.checkInTime?.toISOString() ?? null,
      checkOutTime: record.checkOutTime?.toISOString() ?? null,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
