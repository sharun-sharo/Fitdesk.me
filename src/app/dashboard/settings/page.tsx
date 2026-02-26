import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.gymId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { name: true, email: true, phone: true },
  });
  const gym = await prisma.gym.findUnique({
    where: { id: session.gymId },
    select: { name: true },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Your account and gym details
        </p>
      </div>

      <Card className="rounded-xl border-border/50 shadow-sm max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="text-foreground">{user?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-foreground">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Phone</p>
            <p className="text-foreground">{user?.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gym</p>
            <p className="text-foreground">{gym?.name ?? "—"}</p>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Contact admin to change informations
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
