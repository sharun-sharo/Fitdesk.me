import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/layouts/admin-sidebar";
import { AdminHeader } from "@/components/layouts/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { name: true, email: true },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen gradient-bg admin-page-bg">
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0 ml-0 lg:ml-64">
        <AdminHeader name={user.name} email={user.email} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
