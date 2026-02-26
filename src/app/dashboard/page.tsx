import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.gymId) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { name: true },
  });
  const userName = user?.name ?? "User";
  return <DashboardView userName={userName} />;
}
