"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bell, CreditCard, Tag } from "lucide-react";
import type { RecommendedAction } from "@/lib/ai-insights";

type Props = { actions: RecommendedAction[] };

export function RecommendedActionsSection({ actions }: Props) {
  if (actions.length === 0) return null;

  const iconMap = {
    send_reminder: Bell,
    follow_up_payment: CreditCard,
    offer_discount: Tag,
  };

  return (
    <Card className="rounded-2xl border-primary/20 bg-primary/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Recommended Actions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Turn insights into revenue—take action on high-risk and unpaid clients
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => {
            const Icon = iconMap[a.type];
            const href =
              a.type === "send_reminder"
                ? "/dashboard/clients?status=EXPIRING_SOON"
                : a.type === "follow_up_payment"
                  ? "/dashboard/clients?payment=pending"
                  : "/dashboard/clients?status=EXPIRED";
            return (
              <Button key={a.id} variant="secondary" size="sm" className="rounded-xl gap-2" asChild>
                <Link href={href}>
                  <Icon className="h-4 w-4" />
                  {a.label} ({a.count})
                </Link>
              </Button>
            );
          })}
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          {actions.map((a) => {
            const preview =
              a.clientsPreview && a.clientsPreview.length > 0
                ? a.clientsPreview
                    .map((c) => (c.meta ? `${c.name} (${c.meta})` : c.name))
                    .join(", ")
                : "";
            return (
              <div key={a.id}>
                <span className="font-medium text-foreground">{a.label}</span>
                {a.sublabel && <span> — {a.sublabel}</span>}
                {preview && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Top clients: {preview}
                    {a.clientIds.length > (a.clientsPreview?.length ?? 0) && " …"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
