import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const fullName = body.fullName?.trim();
    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        gymId: session.gymId,
        fullName,
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        subscriptionStartDate: body.subscriptionStartDate
          ? new Date(body.subscriptionStartDate)
          : null,
        subscriptionEndDate: body.subscriptionEndDate
          ? new Date(body.subscriptionEndDate)
          : null,
        subscriptionStatus: body.subscriptionStatus || "ACTIVE",
        totalAmount: new Decimal(Number(body.totalAmount) || 0),
        amountPaid: new Decimal(Number(body.amountPaid) || 0),
      },
    });

    return NextResponse.json({
      ...client,
      totalAmount: Number(client.totalAmount),
      amountPaid: Number(client.amountPaid),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
