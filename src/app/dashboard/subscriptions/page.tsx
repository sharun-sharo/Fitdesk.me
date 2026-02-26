"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, isExpiringWithinDays, daysUntil } from "@/lib/utils";
import { format as formatDateFns } from "date-fns";
import { LayoutDashboard, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type SubscriptionStatusOption = "ACTIVE" | "EXPIRED" | "CANCELLED";

export const dynamic = "force-dynamic";

type SubscriptionRow = {
  id: string;
  fullName: string;
  joinDate: string;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  subscriptionStatus: string;
};

function DaysLeftCell({ subscriptionEndDate, status }: { subscriptionEndDate: string | null; status: string }) {
  if (!subscriptionEndDate) return <span className="text-muted-foreground">—</span>;
  const days = daysUntil(subscriptionEndDate);
  if (status === "EXPIRED" || days < 0) {
    const abs = Math.abs(days);
    return (
      <span className="text-muted-foreground">
        Expired {abs} day{abs !== 1 ? "s" : ""} ago
      </span>
    );
  }
  if (days === 0) return <span className="text-amber-600 font-medium">Expires today</span>;
  if (days === 1) return <span className="text-amber-600 font-medium">1 day left</span>;
  return <span className="tabular-nums">{days} days left</span>;
}

function StatusBadge({ status, subscriptionEndDate }: { status: string; subscriptionEndDate: string | null }) {
  const expiringSoon =
    subscriptionEndDate && status === "ACTIVE" && isExpiringWithinDays(subscriptionEndDate, 7);
  if (expiringSoon) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-amber-300/50 bg-amber-500/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
        Expiring soon
      </span>
    );
  }
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-emerald-300/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
        Active
      </span>
    );
  }
  if (status === "EXPIRED") {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-rose-300/40 bg-rose-500/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-rose-700 dark:text-rose-300">
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {status}
    </span>
  );
}

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  const [subSaving, setSubSaving] = useState(false);
  const [subForm, setSubForm] = useState({
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    subscriptionStatus: "ACTIVE" as SubscriptionStatusOption,
  });

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/clients?page=1&limit=500");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setItems(
          data.items.map((c: SubscriptionRow & { joinDate?: string }) => ({
            id: c.id,
            fullName: c.fullName,
            joinDate: c.joinDate ?? "",
            subscriptionStartDate: c.subscriptionStartDate,
            subscriptionEndDate: c.subscriptionEndDate,
            subscriptionStatus: c.subscriptionStatus,
          }))
        );
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (!selectedClientId) {
      setSubForm({ subscriptionStartDate: "", subscriptionEndDate: "", subscriptionStatus: "ACTIVE" });
      return;
    }
    const client = items.find((c) => c.id === selectedClientId);
    if (client) {
      setSubForm({
        subscriptionStartDate: client.subscriptionStartDate ?? "",
        subscriptionEndDate: client.subscriptionEndDate ?? "",
        subscriptionStatus: (client.subscriptionStatus as SubscriptionStatusOption) || "ACTIVE",
      });
    }
  }, [selectedClientId, items]);

  async function handleSaveSubscription(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId) {
      toast({ title: "Select a client", variant: "destructive" });
      return;
    }
    setSubSaving(true);
    try {
      const res = await fetch(`/api/dashboard/clients/${selectedClientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionStartDate: subForm.subscriptionStartDate || null,
          subscriptionEndDate: subForm.subscriptionEndDate || null,
          subscriptionStatus: subForm.subscriptionStatus && ["ACTIVE", "EXPIRED", "CANCELLED"].includes(subForm.subscriptionStatus)
            ? subForm.subscriptionStatus
            : "ACTIVE",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to update subscription", variant: "destructive" });
        return;
      }
      toast({ title: "Subscription updated", variant: "success" });
      setSelectedClientId("");
      setLoading(true);
      await fetchItems();
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSubSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="space-y-4">
        <nav
          className="flex items-center gap-2 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground font-medium">Subscriptions</span>
        </nav>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Track all member subscriptions, start and end dates, and status
          </p>
        </div>
      </div>

      {/* Add / Update subscription */}
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSaveSubscription} className="space-y-4 rounded-xl border p-4 bg-muted/10">
            <p className="text-sm font-medium">Add / Update subscription</p>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="rounded-lg">
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start date</Label>
                <DatePickerField
                  value={subForm.subscriptionStartDate || undefined}
                  onChange={(d) => {
                    setSubForm((f) => ({
                      ...f,
                      subscriptionStartDate: d ? formatDateFns(d, "yyyy-MM-dd") : "",
                    }));
                    if (d) setTimeout(() => setEndDatePickerOpen(true), 0);
                  }}
                  placeholder="mm/dd/yyyy"
                />
              </div>
              <div className="space-y-2">
                <Label>Expires (end date)</Label>
                <DatePickerField
                  value={subForm.subscriptionEndDate || undefined}
                  open={endDatePickerOpen}
                  onOpenChange={setEndDatePickerOpen}
                  onChange={(d) =>
                    setSubForm((f) => ({
                      ...f,
                      subscriptionEndDate: d ? formatDateFns(d, "yyyy-MM-dd") : "",
                    }))
                  }
                  placeholder="mm/dd/yyyy"
                  fromDate={subForm.subscriptionStartDate ? new Date(subForm.subscriptionStartDate) : undefined}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={subForm.subscriptionStatus}
                onValueChange={(v: SubscriptionStatusOption) =>
                  setSubForm((f) => ({ ...f, subscriptionStatus: v }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={subSaving} className="rounded-xl">
                {subSaving ? "Saving…" : "Save subscription"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setSelectedClientId("");
                  setEndDatePickerOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 px-6 text-center text-muted-foreground">
              <CalendarRange className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No subscriptions yet</p>
              <p className="text-sm mt-1">Add clients and set their subscription dates from the Clients page.</p>
              <Button variant="default" className="mt-4 rounded-xl" asChild>
                <Link href="/dashboard/clients">Go to Clients</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Subscriptions">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="text-left p-4 py-5 font-medium">Member</th>
                    <th className="text-left p-4 py-5 font-medium">Subscribed date</th>
                    <th className="text-left p-4 py-5 font-medium">Start date</th>
                    <th className="text-left p-4 py-5 font-medium">End date</th>
                    <th className="text-left p-4 py-5 font-medium">Days left</th>
                    <th className="text-left p-4 py-5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const expiringSoon =
                      row.subscriptionEndDate &&
                      row.subscriptionStatus === "ACTIVE" &&
                      isExpiringWithinDays(row.subscriptionEndDate, 7);
                    const isExpired = row.subscriptionStatus === "EXPIRED";
                    const borderColor = isExpired
                      ? "border-l-rose-500"
                      : expiringSoon
                        ? "border-l-amber-500"
                        : row.subscriptionStatus === "ACTIVE"
                          ? "border-l-emerald-500"
                          : "border-l-border";
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-border/30 last:border-0 transition-colors duration-150 hover:bg-muted/25 border-l-4",
                          borderColor
                        )}
                      >
                        <td className="p-4 py-5 align-middle">
                          <Link
                            href={`/dashboard/clients/${row.id}`}
                            className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                          >
                            {row.fullName}
                          </Link>
                        </td>
                        <td className="p-4 py-5 text-muted-foreground tabular-nums align-middle">
                          {row.joinDate ? formatDate(row.joinDate) : "—"}
                        </td>
                        <td className="p-4 py-5 text-muted-foreground tabular-nums align-middle">
                          {row.subscriptionStartDate
                            ? formatDate(row.subscriptionStartDate)
                            : "—"}
                        </td>
                        <td className="p-4 py-5 text-muted-foreground tabular-nums align-middle">
                          {row.subscriptionEndDate
                            ? formatDate(row.subscriptionEndDate)
                            : "—"}
                        </td>
                        <td className="p-4 py-5 align-middle">
                          <DaysLeftCell
                            subscriptionEndDate={row.subscriptionEndDate}
                            status={row.subscriptionStatus}
                          />
                        </td>
                        <td className="p-4 py-5 align-middle">
                          <StatusBadge
                            status={row.subscriptionStatus}
                            subscriptionEndDate={row.subscriptionEndDate}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
