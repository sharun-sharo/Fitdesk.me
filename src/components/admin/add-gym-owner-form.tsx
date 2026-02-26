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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type PlanOption = { id: string; name: string; price: number; durationInDays: number };

export function AddGymOwnerForm({
  open,
  onOpenChange,
  onSuccess,
  plans,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
  plans: PlanOption[];
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gymName: "",
    subscriptionPlanId: "__none__",
    durationDays: "30",
  });
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.gymName.trim()) {
      toast({ title: "Name, email and gym name are required", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gym-owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
          gymName: form.gymName.trim(),
          subscriptionPlanId: form.subscriptionPlanId !== "__none__" ? form.subscriptionPlanId : null,
          durationDays: parseInt(form.durationDays, 10) || 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to add gym owner", variant: "destructive" });
        return;
      }
      toast({ title: "Gym owner added", variant: "success" });
      setForm({ name: "", email: "", phone: "", password: "", gymName: "", subscriptionPlanId: "__none__", durationDays: "30" });
      onSuccess();
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add Gym Owner</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner-name">Owner name</Label>
              <Input
                id="owner-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-email">Email</Label>
              <Input
                id="owner-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="owner@gym.com"
                className="rounded-xl"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-phone">Phone (optional)</Label>
            <Input
              id="owner-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-password">Password</Label>
            <Input
              id="owner-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Min 6 characters"
              className="rounded-xl"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gym-name">Gym name</Label>
            <Input
              id="gym-name"
              value={form.gymName}
              onChange={(e) => setForm((f) => ({ ...f, gymName: e.target.value }))}
              placeholder="My Gym"
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Subscription plan (optional)</Label>
            <Select
              value={form.subscriptionPlanId}
              onValueChange={(v) => setForm((f) => ({ ...f, subscriptionPlanId: v }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="No plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No plan</SelectItem>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.price)} / {p.durationInDays} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.subscriptionPlanId !== "__none__" && (
            <div className="space-y-2">
              <Label htmlFor="add-duration">Duration (days)</Label>
              <Input
                id="add-duration"
                type="number"
                min="1"
                value={form.durationDays}
                onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl">
              {loading ? "Adding..." : "Add Gym Owner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
