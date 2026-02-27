import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveSubscriptionStatus } from "@/lib/utils";
import { ClientProfile } from "./client-profile";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.gymId) notFound();
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, gymId: session.gymId },
    include: {
      payments: { orderBy: { paymentDate: "desc" } },
      history: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!client) notFound();

  const amountPaidFromPayments = client.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const totalAmount = Number(client.totalAmount);
  const storedAmountPaid = Number(client.amountPaid);

  const serialized = {
    ...client,
    totalAmount,
    amountPaid: amountPaidFromPayments,
    storedAmountPaid,
    joinDate: client.joinDate.toISOString(),
    dateOfBirth: client.dateOfBirth?.toISOString() ?? null,
    subscriptionStartDate: client.subscriptionStartDate?.toISOString() ?? null,
    subscriptionEndDate: client.subscriptionEndDate?.toISOString() ?? null,
    subscriptionStatus: getEffectiveSubscriptionStatus(
      client.subscriptionStatus,
      client.subscriptionEndDate?.toISOString() ?? null
    ),
    payments: client.payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      paymentDate: p.paymentDate.toISOString(),
    })),
    history: client.history.map((h) => ({
      id: h.id,
      message: h.message,
      createdAt: h.createdAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <ClientProfile client={serialized} />
    </div>
  );
}
