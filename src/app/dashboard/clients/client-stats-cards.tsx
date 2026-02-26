"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { UserCheck, UserX, AlertCircle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  totalClients: number;
  activeClients: number;
  expiredClients: number;
  expiringSoonCount: number;
  pendingPayments: number;
  clientsThisMonth?: number;
  membersWithOutstanding?: number;
} | null;

export function ClientStatsCards({ stats, loading }: { stats: Stats; loading: boolean }) {
  const cards = [
    {
      label: "Active Members",
      value: stats?.activeClients ?? 0,
      micro: stats != null && (stats.clientsThisMonth ?? 0) > 0 ? `+${stats.clientsThisMonth} this month` : undefined,
      icon: UserCheck,
      accent: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Expired Members",
      value: stats?.expiredClients ?? 0,
      micro: stats != null && (stats.expiredClients ?? 0) > 0 ? "Needs follow-up" : undefined,
      icon: UserX,
      accent: "text-rose-600",
      bg: "bg-rose-500/10",
    },
    {
      label: "Expiring Soon",
      value: stats?.expiringSoonCount ?? 0,
      icon: AlertCircle,
      accent: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: "Total Outstanding",
      value: stats != null ? formatCurrency(stats.pendingPayments) : "—",
      micro: stats != null && (stats.membersWithOutstanding ?? 0) > 0 ? `From ${stats.membersWithOutstanding} members` : undefined,
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
                    <>
                      <p
                        className={cn(
                          "text-2xl font-bold mt-1 tabular-nums",
                          card.isCurrency ? "text-foreground" : ""
                        )}
                      >
                        {card.value}
                      </p>
                      {"micro" in card && card.micro && (
                        <p className="text-xs text-muted-foreground mt-0.5">{card.micro}</p>
                      )}
                    </>
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
