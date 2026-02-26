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

type GymRow = {
  id: string;
  name: string;
  ownerEmail: string;
  planId: string | null;
};

type PlanOption = { id: string; name: string; price: number; durationInDays: number };

export function AssignPlanForm({
  gym,
  plans,
  onClose,
  onSuccess,
}: {
  gym: GymRow;
  plans: PlanOption[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState(gym.planId || plans[0]?.id || "");
  const [durationDays, setDurationDays] = useState("30");
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!planId) {
      toast({ title: "Select a plan", variant: "destructive" });
      return;
    }
    const days = parseInt(durationDays, 10) || 30;
    const start = new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gyms/${gym.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionPlanId: planId,
          subscriptionStartDate: start.toISOString(),
          subscriptionEndDate: end.toISOString(),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: d.error || "Failed to assign plan", variant: "destructive" });
        return;
      }
      toast({ title: "Subscription assigned", variant: "success" });
      onSuccess();
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!gym} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Assign subscription</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {gym.name} — {gym.ownerEmail}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.price)} / {p.durationInDays} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assign-duration">Duration (days)</Label>
            <Input
              id="assign-duration"
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl">
              {loading ? "Saving..." : "Assign Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
