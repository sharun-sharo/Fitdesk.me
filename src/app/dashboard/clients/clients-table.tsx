"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  formatCurrency,
  formatDate,
  isExpiringWithinDays,
  daysUntil,
  getEffectiveSubscriptionStatus,
} from "@/lib/utils";
import { debounceWithCancel } from "@/lib/utils";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  MoreHorizontal,
  Trash2,
  MessageCircle,
  Pencil,
  CreditCard,
  Download,
  Upload,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type ClientRow = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  joinDate: string;
  subscriptionEndDate: string | null;
  subscriptionStatus: string;
  totalAmount: number;
  amountPaid: number;
  pendingAmount: number;
  lastPaymentDate: string | null;
};

// ----- Reusable components -----

export function StatusBadge({
  status,
  subscriptionEndDate,
}: {
  status: string;
  subscriptionEndDate: string | null;
}) {
  const expiringSoon =
    subscriptionEndDate &&
    status === "ACTIVE" &&
    isExpiringWithinDays(subscriptionEndDate, 7);
  const days = subscriptionEndDate ? daysUntil(subscriptionEndDate) : null;

  if (expiringSoon && subscriptionEndDate && days !== null) {
    const isToday = days === 0;
    const isOneDay = days === 1;
    const isUrgent = days <= 3;
    const subtextClass = isToday || isOneDay
      ? "text-red-600 dark:text-red-400"
      : isUrgent
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";
    const label = isToday
      ? "Expires today"
      : isOneDay
        ? "Expires in 1 day"
        : `Expires in ${days} days`;
    return (
      <div className="flex flex-col gap-1 text-left">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-amber-300/50 bg-amber-500/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
          Expiring soon
        </span>
        <span className={cn("text-xs", subtextClass)}>{label}</span>
      </div>
    );
  }
  if (status === "ACTIVE") {
    return (
      <div className="flex flex-col gap-1 text-left">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-emerald-300/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Active
        </span>
      </div>
    );
  }
  if (status === "EXPIRED") {
    return (
      <div className="flex flex-col gap-1 text-left">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-rose-300/40 bg-rose-500/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-rose-700 dark:text-rose-300">
          Expired
        </span>
      </div>
    );
  }
  return (
    <Badge variant="secondary" className="w-fit font-medium uppercase tracking-wide text-xs">
      {status}
    </Badge>
  );
}

function LastPaidCell({ amountPaid, lastPaymentDate }: { amountPaid: number; lastPaymentDate: string | null }) {
  return (
    <div className="text-left [&_p]:m-0 [&_p:not(:first-child)]:mt-0.5">
      {amountPaid > 0 ? (
        <>
          <p className="font-semibold text-base tabular-nums">{formatCurrency(amountPaid)}</p>
          {lastPaymentDate && (
            <p className="text-xs text-muted-foreground">on {formatDate(lastPaymentDate)}</p>
          )}
        </>
      ) : (
        <>
          <p className="font-medium text-base tabular-nums text-muted-foreground">—</p>
          <p className="text-xs text-muted-foreground">No payments yet</p>
        </>
      )}
    </div>
  );
}

function OutstandingCell({
  pendingAmount,
  subscriptionEndDate,
}: {
  pendingAmount: number;
  subscriptionEndDate: string | null;
}) {
  if (pendingAmount <= 0) {
    return (
      <p className="text-left text-sm font-medium text-emerald-600 dark:text-emerald-400 m-0">No dues</p>
    );
  }
  return (
    <div className="text-left [&_p]:m-0 [&_p:not(:first-child)]:mt-0.5">
      <p className="font-semibold tabular-nums text-red-600 dark:text-red-400 text-base">
        {formatCurrency(pendingAmount)}
      </p>
      <p className="text-xs text-red-600/80 dark:text-red-400/80">Due</p>
      {subscriptionEndDate && (
        <p className="text-xs text-muted-foreground">Since {formatDate(subscriptionEndDate)}</p>
      )}
    </div>
  );
}

const limit = 10;
const DEBOUNCE_MS = 300;

export function ClientsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [paymentFilter, setPaymentFilter] = useState("__all__");
  const [expiringFilter, setExpiringFilter] = useState("__all__");
  const [loading, setLoading] = useState(true);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<"name" | "expiry" | "amount">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const statusParam = statusFilter === "__all__" ? "" : statusFilter;

  const fetchClients = useCallback(
    async (p: number, s: string, st: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(limit),
          ...(s && { search: s }),
          ...(st && { status: st }),
        });
        const res = await fetch(`/api/dashboard/clients?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch");
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
      } catch {
        toast({ title: "Failed to load clients", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const debouncedFetch = useMemo(
    () =>
      debounceWithCancel((p: number, s: string, st: string) => {
        fetchClients(p, s, st);
      }, DEBOUNCE_MS),
    [fetchClients]
  );

  useEffect(() => {
    fetchClients(page, search, statusParam);
  }, [page, statusParam, fetchClients]);

  useEffect(() => {
    if (search === "") {
      debouncedFetch.cancel();
      setPage(1);
      fetchClients(1, "", statusParam);
    } else {
      setPage(1);
      debouncedFetch.run(1, search, statusParam);
    }
    return () => debouncedFetch.cancel();
  }, [search, statusParam, fetchClients, debouncedFetch]);

  useEffect(() => {
    const handler = () => fetchClients(page, search, statusParam);
    window.addEventListener("clients-refresh", handler);
    return () => window.removeEventListener("clients-refresh", handler);
  }, [page, search, statusParam, fetchClients]);

  const filteredItems = useMemo(() => {
    let list = [...items];
    if (paymentFilter === "paid") list = list.filter((c) => c.pendingAmount <= 0);
    if (paymentFilter === "pending") list = list.filter((c) => c.pendingAmount > 0);
    if (expiringFilter === "expiring") {
      list = list.filter(
        (c) =>
          c.subscriptionEndDate &&
          c.subscriptionStatus === "ACTIVE" &&
          isExpiringWithinDays(c.subscriptionEndDate, 7)
      );
    }
    list.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") return mul * a.fullName.localeCompare(b.fullName);
      if (sortKey === "expiry") {
        const da = a.subscriptionEndDate ? new Date(a.subscriptionEndDate).getTime() : 0;
        const db = b.subscriptionEndDate ? new Date(b.subscriptionEndDate).getTime() : 0;
        return mul * (da - db);
      }
      return mul * (a.totalAmount - b.totalAmount);
    });
    return list;
  }, [items, paymentFilter, expiringFilter, sortKey, sortDir]);

  const hasActiveFilters =
    statusFilter !== "__all__" || paymentFilter !== "__all__" || expiringFilter !== "__all__";

  const clearFilters = () => {
    setStatusFilter("__all__");
    setPaymentFilter("__all__");
    setExpiringFilter("__all__");
    setPage(1);
  };

  const toggleSort = (key: "name" | "expiry" | "amount") => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredItems.map((c) => c.id)));
  };

  function canSendReminder(client: ClientRow): boolean {
    const effectiveStatus = getEffectiveSubscriptionStatus(
      client.subscriptionStatus,
      client.subscriptionEndDate
    );
    const expiringSoon =
      !!client.subscriptionEndDate &&
      effectiveStatus === "ACTIVE" &&
      isExpiringWithinDays(client.subscriptionEndDate, 7);
    return effectiveStatus === "EXPIRED" || expiringSoon;
  }

  async function handleSendReminder(client: ClientRow) {
    if (!canSendReminder(client)) {
      toast({
        title: "Cannot send reminder",
        description: "Reminders are only for expired or expiring-soon clients.",
        variant: "destructive",
      });
      return;
    }
    if (!client.phone?.trim()) {
      toast({
        title: "No phone number",
        description: "Add a phone number to send SMS reminder.",
        variant: "destructive",
      });
      return;
    }
    setSendingReminderId(client.id);
    try {
      const res = await fetch(`/api/dashboard/clients/${client.id}/send-reminder`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Failed to send",
          description: data.error || "Could not send reminder",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Reminder sent",
        description: "SMS reminder sent to " + client.fullName,
      });
    } catch {
      toast({ title: "Failed to send reminder", variant: "destructive" });
    } finally {
      setSendingReminderId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/dashboard/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Client deleted" });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      window.dispatchEvent(new Event("clients-refresh"));
    } catch {
      toast({ title: "Could not delete client", variant: "destructive" });
    }
  }

  function copyPhone(phone: string) {
    navigator.clipboard.writeText(phone).then(() => toast({ title: "Copied to clipboard" }));
  }

  function exportCSV() {
    const headers = [
      "Name",
      "Phone",
      "Email",
      "Status",
      "Expiry",
      "Last Paid",
      "Last Payment Date",
      "Outstanding",
    ];
    const rows = filteredItems.map((c) =>
      [
        c.fullName,
        c.phone ?? "",
        c.email ?? "",
        c.subscriptionStatus,
        c.subscriptionEndDate ?? "",
        c.amountPaid,
        c.lastPaymentDate ?? "",
        c.pendingAmount,
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export downloaded" });
  }

  const selectedClients = filteredItems.filter((c) => selectedIds.has(c.id));
  const expiredCount = selectedClients.filter((c) => canSendReminder(c)).length;

  return (
    <div className="space-y-4">
      {/* Search & filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Search by name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl h-10"
            aria-label="Search clients by name or phone number"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[130px] rounded-xl h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="EXPIRING_SOON">Expiring Soon</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={paymentFilter}
          onValueChange={(v) => {
            setPaymentFilter(v);
          }}
        >
          <SelectTrigger className="w-[130px] rounded-xl h-10">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={expiringFilter}
          onValueChange={setExpiringFilter}
        >
          <SelectTrigger className="w-[160px] rounded-xl h-10">
            <SelectValue placeholder="Expiry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="expiring">Expiring in 7 days</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={clearFilters}
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5 ml-auto"
          onClick={exportCSV}
          disabled={filteredItems.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          {expiredCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg gap-1.5"
              onClick={() => {
                selectedClients.forEach((c) => {
                  if (canSendReminder(c) && c.phone?.trim()) {
                    handleSendReminder(c);
                  }
                });
                setSelectedIds(new Set());
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Send reminder ({expiredCount})
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </Button>
        </div>
      )}

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="rounded-full bg-muted/50 p-6 mb-4">
                <User className="h-14 w-14 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No clients yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Add your first client to get started. You can then track payments and subscriptions.
              </p>
              <Button
                size="lg"
                className="mt-6 rounded-xl"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("open-add-client"))
                }
              >
                Add your first client
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">No clients match the current filters.</p>
              <Button variant="link" className="mt-2" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="md:hidden divide-y divide-border/50">
                {filteredItems.map((c) => {
                  const isExpired = c.subscriptionStatus === "EXPIRED";
                  const expiringSoon =
                    c.subscriptionEndDate &&
                    c.subscriptionStatus === "ACTIVE" &&
                    isExpiringWithinDays(c.subscriptionEndDate, 7);
                  const borderColor = isExpired
                    ? "border-l-rose-500"
                    : expiringSoon
                      ? "border-l-amber-500"
                      : c.subscriptionStatus === "ACTIVE"
                        ? "border-l-emerald-500"
                        : "border-l-amber-500";
                  return (
                    <div
                      key={c.id}
                      className={cn("p-4 space-y-3 border-l-4 transition-colors hover:bg-muted/20", borderColor)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <Link
                            href={`/dashboard/clients/${c.id}`}
                            className="font-medium text-primary hover:text-primary/90 hover:underline underline-offset-2 transition-colors truncate inline-block"
                          >
                            {c.fullName}
                          </Link>
                          {c.phone && (
                            <button
                              type="button"
                              onClick={() => copyPhone(c.phone!)}
                              className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted text-left"
                            >
                              {c.phone}
                            </button>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl w-56">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/clients/${c.id}`} className="flex items-center gap-2">
                                <FileText className="h-4 w-4" /> View profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/payments?record=${c.id}`} className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" /> Add payment
                              </Link>
                            </DropdownMenuItem>
                            {c.subscriptionStatus === "EXPIRED" || expiringSoon ? (
                              <DropdownMenuItem
                                onClick={() => handleSendReminder(c)}
                                disabled={!c.phone?.trim() || sendingReminderId === c.id}
                                title={!c.phone?.trim() ? "Add phone number to send reminder" : undefined}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                {sendingReminderId === c.id ? "Sending…" : "Send reminder"}
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(c.id, c.fullName)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <StatusBadge
                        status={c.subscriptionStatus}
                        subscriptionEndDate={c.subscriptionEndDate}
                      />
                      <div className="flex justify-between text-sm gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Last paid</p>
                          {c.amountPaid > 0 ? (
                            <p className="font-semibold tabular-nums">{formatCurrency(c.amountPaid)}</p>
                          ) : (
                            <p className="text-muted-foreground">No payments yet</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Outstanding</p>
                          {c.pendingAmount > 0 ? (
                            <p className="font-semibold tabular-nums text-rose-600">{formatCurrency(c.pendingAmount)} due</p>
                          ) : (
                            <p className="text-emerald-600">No dues</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm" role="table" aria-label="Clients">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/20">
                      <th className="w-10 p-4 py-5">
                        <input
                          type="checkbox"
                          checked={
                            filteredItems.length > 0 &&
                            selectedIds.size === filteredItems.length
                          }
                          onChange={toggleSelectAll}
                          aria-label="Select all"
                          className="rounded border-input"
                        />
                      </th>
                      <th
                        className="text-left p-4 py-5 font-medium cursor-pointer hover:bg-muted/50 transition-colors select-none"
                        onClick={() => toggleSort("name")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Name
                          {sortKey === "name" &&
                            (sortDir === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </span>
                      </th>
                      <th className="text-left p-4 py-5 font-medium w-[200px]">Status</th>
                      <th
                        className="text-left p-4 py-5 font-medium cursor-pointer hover:bg-muted/50 transition-colors select-none"
                        onClick={() => toggleSort("expiry")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Expires
                          {sortKey === "expiry" &&
                            (sortDir === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </span>
                      </th>
                      <th className="text-left p-4 py-5 font-medium">Last Paid</th>
                      <th className="text-left p-4 py-5 font-medium">Outstanding</th>
                      <th className="text-left p-4 py-5 font-medium w-[1%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((c) => {
                      const expiringSoon =
                        c.subscriptionEndDate &&
                        c.subscriptionStatus === "ACTIVE" &&
                        isExpiringWithinDays(c.subscriptionEndDate, 7);
                      const isExpired = c.subscriptionStatus === "EXPIRED";
                      const borderColor = isExpired
                        ? "border-l-rose-500"
                        : expiringSoon
                          ? "border-l-amber-500"
                          : c.subscriptionStatus === "ACTIVE"
                            ? "border-l-emerald-500"
                            : "border-l-border";

                      const primaryHref =
                        isExpired
                          ? `/dashboard/clients/${c.id}`
                          : c.subscriptionStatus === "ACTIVE" && !expiringSoon
                            ? `/dashboard/clients/${c.id}`
                            : `/dashboard/payments?record=${c.id}`;
                      const primaryLabel =
                        isExpired
                          ? "Renew"
                          : c.subscriptionStatus === "ACTIVE" && !expiringSoon
                            ? "Add Subscription"
                            : "Add payment";

                      return (
                        <tr
                          key={c.id}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest("button, a, input, [role='menuitem']")) return;
                            router.push(`/dashboard/clients/${c.id}`);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !(e.target as HTMLElement).closest("button, a, input")) {
                              e.preventDefault();
                              router.push(`/dashboard/clients/${c.id}`);
                            }
                          }}
                          className={cn(
                            "border-b border-border/30 last:border-0 transition-colors duration-150 hover:bg-muted/25 border-l-4 cursor-pointer",
                            borderColor
                          )}
                        >
                          <td className="p-4 py-5 align-middle" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(c.id)}
                              onChange={() => toggleSelect(c.id)}
                              aria-label={`Select ${c.fullName}`}
                              className="rounded border-input"
                            />
                          </td>
                          <td className="p-4 py-5 align-middle">
                            <div className="flex flex-col gap-0.5">
                              <Link
                                href={`/dashboard/clients/${c.id}`}
                                className="font-medium text-primary hover:text-primary/90 hover:underline underline-offset-2 transition-colors w-fit"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {c.fullName}
                              </Link>
                              {c.phone ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyPhone(c.phone!);
                                  }}
                                  title="Click to copy"
                                  className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted text-left"
                                >
                                  {c.phone}
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground">{c.email ?? "—"}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 py-5 align-middle text-left">
                            <StatusBadge
                              status={c.subscriptionStatus}
                              subscriptionEndDate={c.subscriptionEndDate}
                            />
                          </td>
                          <td className="p-4 py-5 text-muted-foreground tabular-nums align-middle text-left">
                            {c.subscriptionEndDate
                              ? formatDate(c.subscriptionEndDate)
                              : "—"}
                          </td>
                          <td className="p-4 py-5 align-middle w-[120px] text-left">
                            <LastPaidCell amountPaid={c.amountPaid} lastPaymentDate={c.lastPaymentDate} />
                          </td>
                          <td className="p-4 py-5 align-middle w-[100px] text-left">
                            <OutstandingCell
                              pendingAmount={c.pendingAmount}
                              subscriptionEndDate={c.subscriptionEndDate}
                            />
                          </td>
                          <td className="p-4 py-5 align-middle" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end">
                              <div className="flex flex-col items-start gap-2">
                                <div className="flex items-center gap-2">
                                <Button variant="default" size="sm" className="rounded-lg h-8 text-xs shrink-0 min-w-[7.5rem] justify-center" asChild>
                                  <Link href={primaryHref}>{primaryLabel}</Link>
                                </Button>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" aria-label="More actions">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl w-48">
                                  <DropdownMenuItem asChild className="rounded-lg">
                                    <Link href={`/dashboard/clients/${c.id}`} className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" /> View profile
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild className="rounded-lg">
                                    <Link href={`/dashboard/clients/${c.id}`} className="flex items-center gap-2">
                                      <Pencil className="h-4 w-4" /> Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  {(expiringSoon || isExpired) && (
                                    <DropdownMenuItem
                                      className="rounded-lg"
                                      onClick={() => handleSendReminder(c)}
                                      disabled={!c.phone?.trim() || sendingReminderId === c.id}
                                      title={!c.phone?.trim() ? "Add phone to send reminder" : undefined}
                                    >
                                      <MessageCircle className="h-4 w-4 mr-2" />
                                      {sendingReminderId === c.id ? "Sending…" : "Send reminder"}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => handleDelete(c.id, c.fullName)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              </div>
                              {/* Send message: show for expired or expiring soon */}
                              {(isExpired || expiringSoon) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg h-8 text-xs shrink-0 min-w-[7.5rem] justify-center gap-1.5 w-full sm:w-auto border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                                  onClick={() => handleSendReminder(c)}
                                  disabled={!c.phone?.trim() || sendingReminderId === c.id}
                                  title={!c.phone?.trim() ? "Add phone to send message" : undefined}
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  {sendingReminderId === c.id ? "Sending…" : "Send message"}
                                </Button>
                              )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && !loading && items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} client{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
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
