import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

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

    const client = await prisma.client.findFirst({
      where: { id, gymId: session.gymId },
      include: {
        payments: { orderBy: { paymentDate: "desc" } },
      },
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...client,
      totalAmount: Number(client.totalAmount),
      amountPaid: Number(client.amountPaid),
      payments: client.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      joinDate: client.joinDate.toISOString(),
      dateOfBirth: client.dateOfBirth?.toISOString() ?? null,
      subscriptionStartDate: client.subscriptionStartDate?.toISOString() ?? null,
      subscriptionEndDate: client.subscriptionEndDate?.toISOString() ?? null,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
    const body = await request.json();

    const client = await prisma.client.findFirst({
      where: { id, gymId: session.gymId },
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.fullName === "string") data.fullName = body.fullName;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.email !== undefined) data.email = body.email;
    if (body.address !== undefined) data.address = body.address;
    if (body.dateOfBirth !== undefined)
      data.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    if (body.subscriptionStartDate !== undefined)
      data.subscriptionStartDate = body.subscriptionStartDate
        ? new Date(body.subscriptionStartDate)
        : null;
    if (body.subscriptionEndDate !== undefined)
      data.subscriptionEndDate = body.subscriptionEndDate
        ? new Date(body.subscriptionEndDate)
        : null;
    if (body.subscriptionStatus !== undefined)
      data.subscriptionStatus = body.subscriptionStatus;
    if (typeof body.totalAmount === "number")
      data.totalAmount = new Decimal(body.totalAmount);

    const updated = await prisma.client.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ...updated,
      totalAmount: Number(updated.totalAmount),
      amountPaid: Number(updated.amountPaid),
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: { id, gymId: session.gymId },
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
