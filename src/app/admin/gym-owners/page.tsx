import { prisma } from "@/lib/prisma";
import { GymOwnersList } from "@/components/admin/gym-owners-list";

export const dynamic = "force-dynamic";

export default async function AdminGymOwnersPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, price: true, durationInDays: true },
  });
  const plansForSelect = plans.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    durationInDays: p.durationInDays,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gym Owners</h1>
        <p className="text-muted-foreground mt-1">
          Manage gyms and subscriptions
        </p>
      </div>
      <GymOwnersList plans={plansForSelect} />
    </div>
  );
}
