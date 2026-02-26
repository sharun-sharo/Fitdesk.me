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

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialName: string;
  initialEmail: string;
  onSuccess?: () => void;
};

export function AdminProfileDialog({
  open,
  onOpenChange,
  initialName,
  initialEmail,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initialName,
    email: initialEmail,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setForm((f) => ({
        ...f,
        name: initialName,
        email: initialEmail,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    }
  }, [open, initialName, initialEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!form.email.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    if (form.newPassword) {
      if (form.newPassword.length < 6) {
        toast({ title: "New password must be at least 6 characters", variant: "destructive" });
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        toast({ title: "New passwords do not match", variant: "destructive" });
        return;
      }
      if (!form.currentPassword) {
        toast({ title: "Enter your current password to change password", variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    try {
      const body: { name: string; email: string; currentPassword?: string; newPassword?: string } = {
        name: form.name.trim(),
        email: form.email.trim(),
      };
      if (form.newPassword) {
        body.currentPassword = form.currentPassword;
        body.newPassword = form.newPassword;
      }
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to update profile", variant: "destructive" });
        return;
      }
      toast({ title: "Profile updated", variant: "success" });
      onOpenChange(false);
      onSuccess?.();
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
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="admin@fitdesk.me"
              className="rounded-xl"
              required
            />
          </div>
          <div className="border-t pt-4 space-y-2">
            <Label className="text-muted-foreground">Change password (optional)</Label>
            <div className="space-y-2">
              <Input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                placeholder="Current password"
                className="rounded-xl"
              />
              <Input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                placeholder="New password (min 6 characters)"
                className="rounded-xl"
                minLength={6}
              />
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                className="rounded-xl"
              />
            </div>
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
