"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Plan = {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
  features: string[];
  gymCount: number;
};

export function SubscriptionsList({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    durationInDays: "30",
    features: "",
  });
  const router = useRouter();
  const { toast } = useToast();

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    const price = parseFloat(form.price);
    const durationInDays = parseInt(form.durationInDays, 10);
    if (!Number.isFinite(price) || price < 0) {
      toast({ title: "Enter a valid price", variant: "destructive" });
      return;
    }
    if (!Number.isInteger(durationInDays) || durationInDays < 1) {
      toast({ title: "Enter a valid duration (days)", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          price,
          durationInDays,
          features: form.features
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to create plan", variant: "destructive" });
        return;
      }
      toast({ title: "Plan created", variant: "success" });
      setForm({ name: "", price: "", durationInDays: "30", features: "" });
      setCreateOpen(false);
      setPlans((prev) => [...prev, { ...data, gymCount: 0 }]);
      router.refresh();
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create subscription plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Name</Label>
              <Input
                id="plan-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Pro"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-price">Price (₹)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="999"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-duration">Duration (days)</Label>
                <Input
                  id="plan-duration"
                  type="number"
                  min="1"
                  value={form.durationInDays}
                  onChange={(e) => setForm((f) => ({ ...f, durationInDays: e.target.value }))}
                  placeholder="30"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-features">Features (one per line)</Label>
              <textarea
                id="plan-features"
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                placeholder={"Unlimited clients\nAI Insights\nXLSX export"}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className="rounded-xl border-border/50 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{p.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(p.price)}</div>
              <p className="text-sm text-muted-foreground">
                {p.durationInDays} days · {p.gymCount} gym(s)
              </p>
              {Array.isArray(p.features) && p.features.length > 0 && (
                <ul className="mt-2 text-sm list-disc list-inside text-muted-foreground">
                  {p.features.slice(0, 3).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
