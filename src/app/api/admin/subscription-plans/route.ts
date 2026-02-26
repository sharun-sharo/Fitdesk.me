import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = body.name?.trim();
    const price = Number(body.price);
    const durationInDays = Number(body.durationInDays);

    if (!name) {
      return NextResponse.json(
        { error: "Plan name is required" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(durationInDays) || durationInDays < 1) {
      return NextResponse.json(
        { error: "Duration must be a positive number of days" },
        { status: 400 }
      );
    }

    let features: string[] = [];
    if (Array.isArray(body.features)) {
      features = body.features.filter((f: unknown) => typeof f === "string").map((f: string) => f.trim()).filter(Boolean);
    } else if (typeof body.features === "string") {
      features = body.features
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        price: new Decimal(price),
        durationInDays,
        features,
      },
    });

    return NextResponse.json({
      id: plan.id,
      name: plan.name,
      price: Number(plan.price),
      durationInDays: plan.durationInDays,
      features: plan.features as string[],
      gymCount: 0,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
