"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, CreditCard, MoreHorizontal, Search, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AddGymOwnerForm } from "./add-gym-owner-form";
import { AssignPlanForm } from "./assign-plan-form";
import { EditGymOwnerForm } from "./edit-gym-owner-form";

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

type PlanOption = {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
};

export function GymOwnersList({ plans }: { plans: PlanOption[] }) {
  const [gyms, setGyms] = useState<GymRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [planFilter, setPlanFilter] = useState("__all__");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<GymRow | null>(null);
  const [editOpen, setEditOpen] = useState<GymRow | null>(null);
  const limit = 10;
  const router = useRouter();
  const { toast } = useToast();

  const fetchGyms = useCallback(
    async (p: number, s: string, st: string, pl: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(limit),
        });
        if (s) params.set("search", s);
        if (st && st !== "__all__") params.set("status", st);
        if (pl && pl !== "__all__") params.set("planId", pl);
        const res = await fetch(`/api/admin/gym-owners?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setGyms(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        toast({ title: "Failed to load gym owners", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchGyms(page, search, statusFilter, planFilter);
  }, [page, statusFilter, planFilter, fetchGyms]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchGyms(1, search, statusFilter, planFilter);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  async function toggleActive(g: GymRow) {
    try {
      const res = await fetch(`/api/admin/gyms/${g.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !g.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      setGyms((prev) =>
        prev.map((x) => (x.id === g.id ? { ...x, isActive: !g.isActive } : x))
      );
      toast({ title: g.isActive ? "Gym deactivated" : "Gym activated", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    }
  }

  function onAdded() {
    setAddOpen(false);
    setPage(1);
    fetchGyms(1, search, statusFilter, planFilter);
    router.refresh();
  }

  function onAssigned() {
    setAssignOpen(null);
    fetchGyms(page, search, statusFilter, planFilter);
    router.refresh();
  }

  function onEdited() {
    setEditOpen(null);
    fetchGyms(page, search, statusFilter, planFilter);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search gym or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64 rounded-xl"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={planFilter}
            onValueChange={(v) => {
              setPlanFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All plans</SelectItem>
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Add Gym Owner
        </Button>
      </div>

      <AddGymOwnerForm
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={onAdded}
        plans={plans}
      />
      {assignOpen && (
        <AssignPlanForm
          gym={assignOpen}
          plans={plans}
          onClose={() => setAssignOpen(null)}
          onSuccess={onAssigned}
        />
      )}
      <EditGymOwnerForm
        gym={editOpen}
        open={!!editOpen}
        onOpenChange={(v) => !v && setEditOpen(null)}
        onSuccess={onEdited}
      />

      <Card className="rounded-xl border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : gyms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <p className="font-medium text-muted-foreground">No gym owners found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting filters or add a new gym owner
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-4 font-medium">Gym</th>
                    <th className="text-left p-4 font-medium">Owner</th>
                    <th className="text-left p-4 font-medium">Plan</th>
                    <th className="text-left p-4 font-medium">Expires</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="w-12 p-4" />
                  </tr>
                </thead>
                <tbody>
                  {gyms.map((g) => (
                    <tr
                      key={g.id}
                      className="border-b last:border-0 transition-shadow hover:bg-muted/20 hover:shadow-sm"
                    >
                      <td className="p-4 font-medium">{g.name}</td>
                      <td className="p-4">
                        <div>{g.ownerName}</div>
                        <div className="text-sm text-muted-foreground">{g.ownerEmail}</div>
                        {g.ownerPhone && (
                          <div className="text-sm text-muted-foreground">{g.ownerPhone}</div>
                        )}
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
                        <Badge
                          variant={g.isActive ? "success" : "secondary"}
                          className="rounded-lg"
                        >
                          {g.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl w-48">
                            <DropdownMenuItem
                              className="rounded-lg"
                              onClick={() => setEditOpen(g)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg"
                              onClick={() => setAssignOpen(g)}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Assign plan
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg"
                              onClick={() => toggleActive(g)}
                            >
                              {g.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
