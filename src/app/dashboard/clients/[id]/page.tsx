import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    include: { payments: { orderBy: { paymentDate: "desc" } } },
  });

  if (!client) notFound();

  const serialized = {
    ...client,
    totalAmount: Number(client.totalAmount),
    amountPaid: Number(client.amountPaid),
    joinDate: client.joinDate.toISOString(),
    dateOfBirth: client.dateOfBirth?.toISOString() ?? null,
    subscriptionStartDate: client.subscriptionStartDate?.toISOString() ?? null,
    subscriptionEndDate: client.subscriptionEndDate?.toISOString() ?? null,
    payments: client.payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      paymentDate: p.paymentDate.toISOString(),
    })),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <ClientProfile client={serialized} />
    </div>
  );
}
