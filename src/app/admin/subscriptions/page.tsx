import { prisma } from "@/lib/prisma";
import { SubscriptionsList } from "./subscriptions-list";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { gyms: true } } },
  });

  const serialized = plans.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    durationInDays: p.durationInDays,
    features: p.features as string[],
    gymCount: p._count.gyms,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
        <p className="text-muted-foreground mt-1">
          Create and edit plans for gym owners
        </p>
      </div>
      <SubscriptionsList initialPlans={serialized} />
    </div>
  );
}
