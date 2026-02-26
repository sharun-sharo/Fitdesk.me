import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }
    const where = {
      client: { gymId: session.gymId },
      ...(Object.keys(dateFilter).length > 0 ? { paymentDate: dateFilter } : {}),
    };

    const [payments, totalAgg] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          client: { select: { id: true, fullName: true, phone: true } },
        },
        orderBy: { paymentDate: "desc" },
        take: 200,
      }),
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    const list = payments.map((p) => ({
      id: p.id,
      clientId: p.clientId,
      clientName: p.client.fullName,
      clientPhone: p.client.phone,
      amount: Number(p.amount),
      paymentDate: p.paymentDate.toISOString(),
      paymentMethod: p.paymentMethod,
    }));

    return NextResponse.json({
      payments: list,
      totalRevenue: Number(totalAgg._sum.amount ?? 0),
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
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const clientId = body.clientId;
    const amount = Number(body.amount);
    if (!clientId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Valid clientId and amount required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, gymId: session.gymId },
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        clientId,
        amount: new Decimal(amount),
        paymentMethod: body.paymentMethod?.trim() || null,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
      },
    });

    const newPaid = Number(client.amountPaid) + amount;
    await prisma.client.update({
      where: { id: clientId },
      data: { amountPaid: new Decimal(newPaid) },
    });

    return NextResponse.json({
      ...payment,
      amount: Number(payment.amount),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
