"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";

type GymRow = {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;
  ownerId: string;
  planName: string;
  planId: string | null;
  planPrice: number | null;
  subscriptionEndDate: string | null;
  isActive: boolean;
};

export function EditGymOwnerForm({
  gym,
  open,
  onOpenChange,
  onSuccess,
}: {
  gym: GymRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (gym && open) {
      setForm({
        name: gym.name,
        ownerName: gym.ownerName,
        ownerEmail: gym.ownerEmail,
        ownerPhone: gym.ownerPhone ?? "",
      });
    }
  }, [gym, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gym) return;
    if (!form.ownerName.trim() || !form.ownerEmail.trim()) {
      toast({ title: "Owner name and email are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gyms/${gym.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          ownerName: form.ownerName.trim(),
          ownerEmail: form.ownerEmail.trim(),
          ownerPhone: form.ownerPhone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to update", variant: "destructive" });
        return;
      }
      toast({ title: "Gym owner updated", variant: "success" });
      onSuccess();
      onOpenChange(false);
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (!gym) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Gym Owner</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-gym-name">Gym name</Label>
            <Input
              id="edit-gym-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="My Gym"
              className="rounded-xl"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-owner-name">Owner name</Label>
              <Input
                id="edit-owner-name"
                value={form.ownerName}
                onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                placeholder="John Doe"
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-owner-email">Email</Label>
              <Input
                id="edit-owner-email"
                type="email"
                value={form.ownerEmail}
                onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                placeholder="owner@gym.com"
                className="rounded-xl"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-owner-phone">Phone (optional)</Label>
            <Input
              id="edit-owner-phone"
              type="tel"
              value={form.ownerPhone}
              onChange={(e) => setForm((f) => ({ ...f, ownerPhone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl">
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
