"use client";

import { useState } from "react";
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

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const defaultForm = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  dateOfBirth: "",
  subscriptionStartDate: "",
  subscriptionEndDate: "",
  subscriptionStatus: "ACTIVE" as const,
  totalAmount: "",
  amountPaid: "0",
};

export function AddClientDialog({ open, onOpenChange }: Props) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/clients/create", {
        method: "POST",
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
          amountPaid: parseFloat(form.amountPaid) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to add client", variant: "destructive" });
        return;
      }
      toast({ title: "Client added", variant: "success" });
      setForm(defaultForm);
      onOpenChange(false);
      window.dispatchEvent(new CustomEvent("clients-refresh"));
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
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="City, State"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
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
              <Label htmlFor="subStart">Subscription Start</Label>
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
              <Label htmlFor="subEnd">Subscription End</Label>
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
              onValueChange={(v: "ACTIVE" | "EXPIRED" | "CANCELLED") =>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="totalAmount">Total Amount (₹)</Label>
              <Input
                id="totalAmount"
                type="number"
                min="0"
                step="0.01"
                value={form.totalAmount}
                onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
              <Input
                id="amountPaid"
                type="number"
                min="0"
                step="0.01"
                value={form.amountPaid}
                onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
