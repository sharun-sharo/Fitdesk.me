"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, CreditCard, CalendarX, FileText } from "lucide-react";
import type { RecentActivityItem } from "@/hooks/use-dashboard-stats";
import { formatDistanceToNow } from "date-fns";

const ICONS = {
  new_client: UserPlus,
  payment_received: CreditCard,
  subscription_expired: CalendarX,
  invoice_generated: FileText,
};

const COLORS = {
  new_client: "text-emerald-600 bg-emerald-50",
  payment_received: "text-primary bg-primary/10",
  subscription_expired: "text-amber-600 bg-amber-50",
  invoice_generated: "text-blue-600 bg-blue-50",
};

type Props = { items: RecentActivityItem[] };

export function RecentActivity({ items }: Props) {
  if (items.length === 0) {
    return (
      <Card className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold tracking-tight">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-muted-foreground">No recent activity yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <CardHeader className="min-w-0">
        <CardTitle className="text-lg font-bold tracking-tight">Recent Activity</CardTitle>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground">Latest 10 events</p>
      </CardHeader>
      <CardContent className="min-w-0 overflow-hidden">
        <ul className="min-w-0 space-y-0">
          {items.map((a, i) => {
            const Icon = ICONS[a.type];
            const colorClass = COLORS[a.type];
            const href =
              a.type === "new_client" || a.type === "subscription_expired"
                ? `/dashboard/clients${a.id ? `/${a.id}` : ""}`
                : a.type === "payment_received"
                ? "/dashboard/payments"
                : "/dashboard/reports";
            return (
              <li key={`${a.type}-${a.timestamp}-${i}`} className="flex min-w-0 gap-3 rounded-lg py-3 transition-colors first:pt-0 last:pb-0 hover:bg-muted/50">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${colorClass}`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <Link
                    href={href}
                    className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary hover:underline"
                    title={a.label}
                  >
                    {a.label}
                  </Link>
                  <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                    {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
