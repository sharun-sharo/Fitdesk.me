"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus, CreditCard, FileText, MessageCircle, Zap } from "lucide-react";

const actions = [
  {
    label: "Add Client",
    href: "/dashboard/clients",
    icon: UserPlus,
    description: "Register a new member",
  },
  {
    label: "Add payment",
    href: "/dashboard/payments",
    icon: CreditCard,
    description: "Log a payment",
  },
  {
    label: "Add subscription",
    href: "/dashboard/subscriptions",
    icon: FileText,
    description: "Create or renew subscription",
  },
  {
    label: "Send Payment Reminder",
    href: "/dashboard/clients?status=EXPIRED",
    icon: MessageCircle,
    description: "Remind expired members",
  },
];

export function QuickActions() {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <h2 className="text-section-label mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Button
              key={a.label}
              variant="outline"
              className="group h-auto flex-col gap-2 rounded-2xl py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary"
              asChild
            >
              <Link href={a.href}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-card-title">{a.label}</span>
                <span className="hidden text-xs font-medium text-muted-foreground sm:block">
                  {a.description}
                </span>
              </Link>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
