"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { CalendarClock, RefreshCw } from "lucide-react";

type Item = { id: string; fullName: string; subscriptionEndDate: string };

type Props = { items: Item[] };

export function ExpiringSoonList({ items }: Props) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
            <CalendarClock className="h-5 w-5 text-amber-600" />
          </span>
          Expiring Soon
        </CardTitle>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground">
          Members expiring in the next 7 days
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm font-medium text-muted-foreground">No members expiring in the next 7 days.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{c.fullName}</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    Expires {formatDate(c.subscriptionEndDate)}
                  </p>
                </div>
                <Button variant="default" size="sm" className="shrink-0 rounded-lg transition-transform hover:scale-105" asChild>
                  <Link href={`/dashboard/payments?record=${c.id}`}>
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                    Renew
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
