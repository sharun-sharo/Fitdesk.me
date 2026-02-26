"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, isExpiringWithinDays } from "@/lib/utils";
import { ArrowLeft, User, IndianRupee, Calendar } from "lucide-react";

type Payment = { id: string; amount: number; paymentDate: string; paymentMethod: string | null };

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
  payments: Payment[];
};

export function ClientProfile({ client }: { client: Client }) {
  const pending = client.totalAmount - client.amountPaid;
  const expiringSoon =
    client.subscriptionEndDate &&
    client.subscriptionStatus === "ACTIVE" &&
    isExpiringWithinDays(client.subscriptionEndDate, 7);

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Phone:</span> {client.phone || "—"}</p>
            <p><span className="text-muted-foreground">Email:</span> {client.email || "—"}</p>
            <p><span className="text-muted-foreground">Address:</span> {client.address || "—"}</p>
            <p><span className="text-muted-foreground">Join date:</span> {formatDate(client.joinDate)}</p>
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
            {client.subscriptionEndDate && (
              <p>
                <span className="text-muted-foreground">Expires:</span>{" "}
                {formatDate(client.subscriptionEndDate)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IndianRupee className="h-5 w-5" />
              Payments
            </CardTitle>
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
    </div>
  );
}
