"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { format as formatDateFns } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, isExpiringWithinDays } from "@/lib/utils";
import { ArrowLeft, User, IndianRupee, Pencil, Calendar, History, CreditCard, Plus } from "lucide-react";
import { EditClientDialog } from "./edit-client-dialog";
import { useToast } from "@/hooks/use-toast";

type SubscriptionStatusOption = "ACTIVE" | "EXPIRED" | "CANCELLED";

type Payment = { id: string; amount: number; paymentDate: string; paymentMethod: string | null };

type ClientHistoryEntry = { id: string; message: string; createdAt: string };

type Client = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  joinDate: string;
  dateOfBirth: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  subscriptionStatus: string;
  totalAmount: number;
  amountPaid: number;
  storedAmountPaid?: number;
  payments: Payment[];
  history?: ClientHistoryEntry[];
};

export function ClientProfile({ client }: { client: Client }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [subscriptionFormOpen, setSubscriptionFormOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  const [subForm, setSubForm] = useState({
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    subscriptionStatus: "ACTIVE" as SubscriptionStatusOption,
  });
  const [subSaving, setSubSaving] = useState(false);
  const pending = client.totalAmount - client.amountPaid;
  const expiringSoon =
    client.subscriptionEndDate &&
    client.subscriptionStatus === "ACTIVE" &&
    isExpiringWithinDays(client.subscriptionEndDate, 7);

  const hasSubscription =
    client.subscriptionStartDate || client.subscriptionEndDate;

  useEffect(() => {
    if (!subscriptionFormOpen) return;
    setEndDatePickerOpen(false);
    setSubForm({
      subscriptionStartDate: client.subscriptionStartDate ?? "",
      subscriptionEndDate: client.subscriptionEndDate ?? "",
      subscriptionStatus: (client.subscriptionStatus as SubscriptionStatusOption) || "ACTIVE",
    });
  }, [subscriptionFormOpen, client.subscriptionStartDate, client.subscriptionEndDate, client.subscriptionStatus]);

  async function handleSaveSubscription(e: React.FormEvent) {
    e.preventDefault();
    setSubSaving(true);
    try {
      const res = await fetch(`/api/dashboard/clients/${client.id}`, {
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
      setSubscriptionFormOpen(false);
      router.refresh();
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSubSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{client.fullName}</h1>
            <p className="text-muted-foreground">Client profile</p>
          </div>
        </div>
        </div>
      <EditClientDialog
        client={{
          id: client.id,
          fullName: client.fullName,
          phone: client.phone,
          email: client.email,
          address: client.address,
          dateOfBirth: client.dateOfBirth,
          subscriptionStartDate: client.subscriptionStartDate,
          subscriptionEndDate: client.subscriptionEndDate,
          subscriptionStatus: client.subscriptionStatus,
          totalAmount: client.totalAmount,
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Details
            </CardTitle>
            <Button
              size="sm"
              className="rounded-lg shrink-0"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Phone:</span> {client.phone || "—"}</p>
            <p><span className="text-muted-foreground">Email:</span> {client.email || "—"}</p>
            <p><span className="text-muted-foreground">Address:</span> {client.address || "—"}</p>
            <p><span className="text-muted-foreground">Join date:</span> {formatDate(client.joinDate)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <IndianRupee className="h-5 w-5" />
                Payments
              </CardTitle>
              <Button size="sm" className="rounded-lg shrink-0" asChild>
                <Link href={`/dashboard/payments?record=${client.id}`}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add payment
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              Total: {formatCurrency(client.totalAmount)} · Paid:{" "}
              {formatCurrency(client.amountPaid)}
            </p>
            {pending > 0 && (
              <p className="text-amber-600 font-medium">
                Pending: {formatCurrency(pending)}
              </p>
            )}
            {client.payments.length === 0 &&
              client.storedAmountPaid != null &&
              client.storedAmountPaid > 0 && (
                <p className="text-muted-foreground text-sm">
                  Amount paid was entered on record (e.g. from import) but no
                  payment transaction exists yet. Record a payment to add one.
                </p>
            )}
            <div className="mt-4 space-y-1 max-h-48 overflow-y-auto">
              {client.payments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No payments yet</p>
              ) : (
                client.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between text-sm py-1 border-b last:border-0"
                  >
                    <span>{formatDate(p.paymentDate)}</span>
                    <span>{formatCurrency(p.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Subscriptions
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Current subscription and add or update dates
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Existing subscription</p>
            {hasSubscription ? (
              <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                <p>
                  <span className="text-muted-foreground">Start:</span>{" "}
                  {client.subscriptionStartDate ? formatDate(client.subscriptionStartDate) : "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Expires:</span>{" "}
                  {client.subscriptionEndDate ? formatDate(client.subscriptionEndDate) : "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <Badge
                    variant={
                      client.subscriptionStatus === "ACTIVE"
                        ? "success"
                        : client.subscriptionStatus === "EXPIRED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {client.subscriptionStatus}
                  </Badge>
                  {expiringSoon && (
                    <Badge variant="warning" className="ml-1">Expiring soon</Badge>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No subscription set. Add one below.</p>
            )}
          </div>
          {subscriptionFormOpen ? (
            <form onSubmit={handleSaveSubscription} className="space-y-4 rounded-xl border p-4 bg-muted/10">
              <p className="text-sm font-medium">Add / Update subscription</p>
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
                  onClick={() => setSubscriptionFormOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2"
              onClick={() => setSubscriptionFormOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {hasSubscription ? "Update subscription" : "Add subscription"}
            </Button>
          )}
        </CardContent>
      </Card>

      {client.history && client.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              History
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Changes to client details and subscription
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {client.history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline gap-2 text-sm py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-muted-foreground shrink-0">
                    {formatDate(entry.createdAt)}
                  </span>
                  <span>{entry.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
