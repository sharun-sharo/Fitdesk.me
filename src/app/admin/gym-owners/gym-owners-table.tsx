"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type GymRow = {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerId: string;
  planName: string;
  planId: string | null;
  planPrice: number | null;
  subscriptionEndDate: string | null;
  isActive: boolean;
};

type PlanOption = {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
};

export function GymOwnersTable({
  initialGyms,
  plans,
}: {
  initialGyms: GymRow[];
  plans: PlanOption[];
}) {
  const [gyms, setGyms] = useState(initialGyms);
  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<GymRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    gymName: "",
    subscriptionPlanId: "",
    durationDays: "30",
  });
  const [assignForm, setAssignForm] = useState({
    subscriptionPlanId: "",
    durationDays: "30",
  });
  const router = useRouter();
  const { toast } = useToast();

  async function handleAddGymOwner(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.gymName.trim()) {
      toast({ title: "Name, email and gym name are required", variant: "destructive" });
      return;
    }
    if (!addForm.password || addForm.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gym-owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          email: addForm.email.trim(),
          password: addForm.password,
          gymName: addForm.gymName.trim(),
          subscriptionPlanId: addForm.subscriptionPlanId && addForm.subscriptionPlanId !== "__none__" ? addForm.subscriptionPlanId : null,
          durationDays: parseInt(addForm.durationDays, 10) || 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to add gym owner", variant: "destructive" });
        return;
      }
      toast({ title: "Gym owner added", variant: "success" });
      setAddForm({ name: "", email: "", password: "", gymName: "", subscriptionPlanId: "", durationDays: "30" });
      setAddOpen(false);
      setGyms((prev) => [
        {
          id: data.id,
          name: data.name,
          ownerName: data.ownerName,
          ownerEmail: data.ownerEmail,
          ownerId: data.ownerId,
          planName: addForm.subscriptionPlanId && addForm.subscriptionPlanId !== "__none__"
            ? plans.find((p) => p.id === addForm.subscriptionPlanId)?.name ?? "—"
            : "—",
          planId: addForm.subscriptionPlanId && addForm.subscriptionPlanId !== "__none__" ? addForm.subscriptionPlanId : null,
          planPrice: addForm.subscriptionPlanId && addForm.subscriptionPlanId !== "__none__"
            ? plans.find((p) => p.id === addForm.subscriptionPlanId)?.price ?? null
            : null,
          subscriptionEndDate: null,
          isActive: true,
        },
        ...prev,
      ]);
      router.refresh();
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignPlan(e: React.FormEvent) {
    e.preventDefault();
    const gym = assignOpen;
    if (!gym) return;
    const planId = assignForm.subscriptionPlanId;
    if (!planId) {
      toast({ title: "Select a plan", variant: "destructive" });
      return;
    }
    const durationDays = parseInt(assignForm.durationDays, 10) || 30;
    const start = new Date();
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
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
      const plan = plans.find((p) => p.id === planId);
      setGyms((prev) =>
        prev.map((g) =>
          g.id === gym.id
            ? {
                ...g,
                planName: plan?.name ?? "—",
                planId,
                planPrice: plan?.price ?? null,
                subscriptionEndDate: end.toISOString(),
              }
            : g
        )
      );
      toast({ title: "Subscription assigned", variant: "success" });
      setAssignOpen(null);
      router.refresh();
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/gyms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) throw new Error("Failed");
      setGyms((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isActive: !current } : g))
      );
      toast({ title: current ? "Gym deactivated" : "Gym activated", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Gym Owner
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Gym Owner</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGymOwner} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner-name">Owner name</Label>
                <Input
                  id="owner-name"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-email">Email</Label>
                <Input
                  id="owner-email"
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="owner@gym.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-password">Password</Label>
              <Input
                id="owner-password"
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gym-name">Gym name</Label>
              <Input
                id="gym-name"
                value={addForm.gymName}
                onChange={(e) => setAddForm((f) => ({ ...f, gymName: e.target.value }))}
                placeholder="My Gym"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Subscription plan (optional)</Label>
              <Select
                value={addForm.subscriptionPlanId || "__none__"}
                onValueChange={(v) => setAddForm((f) => ({ ...f, subscriptionPlanId: v }))}
              >
                <SelectTrigger>
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
            {addForm.subscriptionPlanId && addForm.subscriptionPlanId !== "__none__" && (
              <div className="space-y-2">
                <Label htmlFor="add-duration">Duration (days)</Label>
                <Input
                  id="add-duration"
                  type="number"
                  min="1"
                  value={addForm.durationDays}
                  onChange={(e) => setAddForm((f) => ({ ...f, durationDays: e.target.value }))}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Gym Owner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignOpen} onOpenChange={() => setAssignOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign subscription</DialogTitle>
            {assignOpen && (
              <p className="text-sm text-muted-foreground">
                {assignOpen.name} — {assignOpen.ownerEmail}
              </p>
            )}
          </DialogHeader>
          <form onSubmit={handleAssignPlan} className="space-y-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                value={assignForm.subscriptionPlanId}
                onValueChange={(v) => setAssignForm((f) => ({ ...f, subscriptionPlanId: v }))}
              >
                <SelectTrigger>
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
                value={assignForm.durationDays}
                onChange={(e) => setAssignForm((f) => ({ ...f, durationDays: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignOpen(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Assign Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Gym</th>
                  <th className="text-left p-4 font-medium">Owner</th>
                  <th className="text-left p-4 font-medium">Plan</th>
                  <th className="text-left p-4 font-medium">Expires</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {gyms.map((g) => (
                  <tr key={g.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-medium">{g.name}</td>
                    <td className="p-4">
                      <div>{g.ownerName}</div>
                      <div className="text-sm text-muted-foreground">{g.ownerEmail}</div>
                    </td>
                    <td className="p-4">
                      {g.planName}
                      {g.planPrice != null && (
                        <span className="text-muted-foreground text-sm ml-1">
                          ({formatCurrency(g.planPrice)})
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      {g.subscriptionEndDate ? formatDate(g.subscriptionEndDate) : "—"}
                    </td>
                    <td className="p-4">
                      <Badge variant={g.isActive ? "success" : "secondary"}>
                        {g.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAssignForm({
                            subscriptionPlanId: g.planId || plans[0]?.id || "",
                            durationDays: "30",
                          });
                          setAssignOpen(g);
                        }}
                      >
                        <CreditCard className="mr-1 h-3 w-3" />
                        Assign plan
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(g.id, g.isActive)}
                      >
                        {g.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
