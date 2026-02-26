"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Users, UserCheck, UserX, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  totalClients: number;
  activeClients: number;
  expiredClients: number;
  pendingPayments: number;
} | null;

export function ClientStatsCards({ stats, loading }: { stats: Stats; loading: boolean }) {
  const cards = [
    {
      label: "Total Clients",
      value: stats?.totalClients ?? 0,
      icon: Users,
      accent: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Active Members",
      value: stats?.activeClients ?? 0,
      icon: UserCheck,
      accent: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Expired Members",
      value: stats?.expiredClients ?? 0,
      icon: UserX,
      accent: "text-rose-600",
      bg: "bg-rose-500/10",
    },
    {
      label: "Pending Payments",
      value: stats != null ? formatCurrency(stats.pendingPayments) : "—",
      icon: Wallet,
      accent: "text-amber-600",
      bg: "bg-amber-500/10",
      isCurrency: true,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className={cn(
              "rounded-2xl border-border/50 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {card.label}
                  </p>
                  {loading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p
                      className={cn(
                        "text-2xl font-bold mt-1 tabular-nums",
                        card.isCurrency ? "text-foreground" : ""
                      )}
                    >
                      {card.value}
                    </p>
                  )}
                </div>
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", card.bg)}>
                  <Icon className={cn("h-6 w-6", card.accent)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
