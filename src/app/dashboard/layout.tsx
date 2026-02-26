import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar";
import { DashboardHeader } from "@/components/layouts/dashboard-header";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "GYM_OWNER") {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { name: true, email: true, gymId: true },
  });

  if (!user) {
    redirect("/login");
  }

  let gymName = "My Gym";
  if (user.gymId) {
    const gym = await prisma.gym.findUnique({
      where: { id: user.gymId },
      select: { name: true },
    });
    if (gym) gymName = gym.name;
  }

  return (
    <div className="flex min-h-screen gradient-bg header-glow">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col min-w-0 ml-0 lg:ml-64">
        <DashboardHeader
          gymName={gymName}
          userName={user.name ?? "User"}
          userEmail={user.email ?? ""}
        />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
