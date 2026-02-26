import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const gym = await prisma.gym.findUnique({
      where: { id: session.gymId },
      select: {
        name: true,
        invoiceLogoUrl: true,
        invoiceAddress: true,
        invoicePhone: true,
        invoiceEmail: true,
        gstNumber: true,
      },
    });
    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }
    return NextResponse.json({
      name: gym.name,
      invoiceLogoUrl: gym.invoiceLogoUrl,
      invoiceAddress: gym.invoiceAddress,
      invoicePhone: gym.invoicePhone,
      invoiceEmail: gym.invoiceEmail,
      gstNumber: gym.gstNumber,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const data: {
      invoiceAddress?: string | null;
      invoicePhone?: string | null;
      invoiceEmail?: string | null;
      gstNumber?: string | null;
    } = {};
    if (typeof body.invoiceAddress === "string" || body.invoiceAddress === null) data.invoiceAddress = body.invoiceAddress || null;
    if (typeof body.invoicePhone === "string" || body.invoicePhone === null) data.invoicePhone = body.invoicePhone || null;
    if (typeof body.invoiceEmail === "string" || body.invoiceEmail === null) data.invoiceEmail = body.invoiceEmail || null;
    if (typeof body.gstNumber === "string" || body.gstNumber === null) data.gstNumber = body.gstNumber || null;

    const gym = await prisma.gym.update({
      where: { id: session.gymId },
      data,
      select: {
        name: true,
        invoiceLogoUrl: true,
        invoiceAddress: true,
        invoicePhone: true,
        invoiceEmail: true,
        gstNumber: true,
      },
    });
    return NextResponse.json(gym);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
