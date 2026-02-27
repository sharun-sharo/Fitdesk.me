import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio-whatsapp";
import { getEffectiveSubscriptionStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
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
      select: { id: true, fullName: true, phone: true, subscriptionStatus: true, subscriptionEndDate: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const effectiveStatus = getEffectiveSubscriptionStatus(
      client.subscriptionStatus,
      client.subscriptionEndDate?.toISOString() ?? null
    );

    let daysUntil: number | null = null;
    if (client.subscriptionEndDate) {
      const now = new Date();
      daysUntil = Math.ceil(
        (client.subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
    const expiringSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;

    if (effectiveStatus !== "EXPIRED" && !expiringSoon) {
      return NextResponse.json(
        { error: "Send reminder is only for expired or expiring-soon subscriptions" },
        { status: 400 }
      );
    }

    const phone = client.phone?.trim();
    if (!phone) {
      return NextResponse.json(
        { error: "Client has no phone number. Add a phone number to send SMS reminder." },
        { status: 400 }
      );
    }

    const message = `Hi ${client.fullName}, your gym membership at our facility is due for renewal. Please visit us or contact us to renew your subscription.`;

    await sendSms({
      to: phone,
      body: message,
    });

    return NextResponse.json({ success: true, message: "SMS reminder sent" });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Send reminder error:", e);
    const message =
      e instanceof Error && e.message
        ? e.message
        : "Failed to send SMS reminder. Check Twilio configuration.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
