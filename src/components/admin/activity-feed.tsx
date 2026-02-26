"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Building2, CreditCard, AlertCircle, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Activity = {
  type: string;
  label: string;
  time: string;
  color: string;
};

const colorMap: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

const iconMap: Record<string, typeof Building2> = {
  gym_registered: Building2,
  plan_created: CreditCard,
  subscription_renewed: Sparkles,
  gym_expired: AlertCircle,
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <Card className="admin-card overflow-hidden">
      <CardHeader className="pb-2">
        <h3 className="text-base font-semibold text-foreground">Recent activity</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Platform events</p>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-0">
          {activities.length === 0 ? (
            <li className="text-sm text-muted-foreground py-8 text-center rounded-xl bg-muted/30">
              No recent activity
            </li>
          ) : (
            activities.map((a, i) => {
              const Icon = iconMap[a.type] || Building2;
              const dotColor = colorMap[a.color] || "bg-primary";
              return (
                <li
                  key={i}
                  className="flex gap-3 py-3 px-2 -mx-2 rounded-xl transition-colors hover:bg-muted/50 first:pt-3 last:pb-3"
                >
                  <div
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(a.time), { addSuffix: true })}
                    </p>
                  </div>
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </li>
              );
            })
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
