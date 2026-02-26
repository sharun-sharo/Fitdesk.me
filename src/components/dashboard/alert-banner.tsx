"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

const DISMISS_KEY = "fitdesk-dashboard-alert-dismissed";

type Props = {
  expiredCount: number;
  pendingPayments: number;
};

export function AlertBanner({ expiredCount, pendingPayments }: Props) {
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY));
    } catch {
      setDismissed(null);
    }
  }, []);

  const showRenewal = expiredCount > 0;
  const showPayment = pendingPayments > 0;
  const show = (showRenewal || showPayment) && !dismissed;

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
      setDismissed("1");
    } catch {
      setDismissed("1");
    }
  }

  if (!show) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3.5 shadow-sm animate-in slide-in duration-300 dark:border-amber-800 dark:bg-amber-950/40">
      <div className="flex flex-wrap items-center gap-4">
        {showRenewal && (
          <Link
            href="/dashboard/clients?status=EXPIRED"
            className="flex items-center gap-2 text-amber-800 transition-colors hover:text-amber-900 hover:underline dark:text-amber-200 dark:hover:text-amber-100"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">
              {expiredCount} subscription{expiredCount !== 1 ? "s" : ""} expired. Send renewal reminders.
            </span>
          </Link>
        )}
        {showPayment && (
          <Link
            href="/dashboard/clients"
            className="flex items-center gap-2 text-amber-800 transition-colors hover:text-amber-900 hover:underline dark:text-amber-200 dark:hover:text-amber-100"
          >
            <CreditCard className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">
              Pending payments: {formatCurrency(pendingPayments)}. Follow up with clients.
            </span>
          </Link>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 rounded-lg text-amber-700 transition-colors hover:bg-amber-100 hover:text-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/50"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
