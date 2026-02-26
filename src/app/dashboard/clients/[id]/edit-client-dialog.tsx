"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";

type SubscriptionStatusOption = "ACTIVE" | "EXPIRED" | "CANCELLED";

type Client = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  dateOfBirth: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  subscriptionStatus: string;
  totalAmount: number;
};

type Props = {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditClientDialog({ client, open, onOpenChange }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    dateOfBirth: "",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    subscriptionStatus: "ACTIVE" as SubscriptionStatusOption,
    totalAmount: "",
  });

  useEffect(() => {
    if (client && open) {
      setForm({
        fullName: client.fullName,
        phone: client.phone ?? "",
        email: client.email ?? "",
        address: client.address ?? "",
        dateOfBirth: client.dateOfBirth ?? "",
        subscriptionStartDate: client.subscriptionStartDate ?? "",
        subscriptionEndDate: client.subscriptionEndDate ?? "",
        subscriptionStatus: (client.subscriptionStatus as SubscriptionStatusOption) || "ACTIVE",
        totalAmount: String(client.totalAmount ?? ""),
      });
    }
  }, [client, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          dateOfBirth: form.dateOfBirth || null,
          subscriptionStartDate: form.subscriptionStartDate || null,
          subscriptionEndDate: form.subscriptionEndDate || null,
          subscriptionStatus: form.subscriptionStatus,
          totalAmount: parseFloat(form.totalAmount) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error && !/^\d+\s*error(s)?$/i.test(String(data.error).trim())
          ? data.error
          : "Failed to update client";
        toast({ title: msg, variant: "destructive" });
        return;
      }
      toast({ title: "Client updated", variant: "success" });
      onOpenChange(false);
      router.refresh();
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-fullName">Full Name *</Label>
            <Input
              id="edit-fullName"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-address">Address</Label>
            <Input
              id="edit-address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="City, State"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
            <DatePickerField
              value={form.dateOfBirth || undefined}
              onChange={(d) =>
                setForm((f) => ({
                  ...f,
                  dateOfBirth: d ? formatDateFns(d, "yyyy-MM-dd") : "",
                }))
              }
              placeholder="mm/dd/yyyy"
              dateOfBirthMode
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Subscription Start</Label>
              <DatePickerField
                value={form.subscriptionStartDate || undefined}
                onChange={(d) =>
                  setForm((f) => ({
                    ...f,
                    subscriptionStartDate: d ? formatDateFns(d, "yyyy-MM-dd") : "",
                  }))
                }
                placeholder="mm/dd/yyyy"
              />
            </div>
            <div className="grid gap-2">
              <Label>Expires (Subscription End)</Label>
              <DatePickerField
                value={form.subscriptionEndDate || undefined}
                onChange={(d) =>
                  setForm((f) => ({
                    ...f,
                    subscriptionEndDate: d ? formatDateFns(d, "yyyy-MM-dd") : "",
                  }))
                }
                placeholder="mm/dd/yyyy"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={form.subscriptionStatus}
              onValueChange={(v: SubscriptionStatusOption) =>
                setForm((f) => ({ ...f, subscriptionStatus: v }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-totalAmount">Total Amount (₹)</Label>
            <Input
              id="edit-totalAmount"
              type="number"
              min="0"
              step="0.01"
              value={form.totalAmount}
              onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
