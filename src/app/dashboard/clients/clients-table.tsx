"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";
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
import { formatCurrency, formatDate, isExpiringWithinDays } from "@/lib/utils";
import { debounce } from "@/lib/utils";
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

  if (expiringSoon) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/50 bg-amber-500/15 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden />
        Expiring soon
      </span>
    );
  }
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
        ACTIVE
      </span>
    );
  }
  if (status === "EXPIRED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/40 bg-rose-500/15 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-rose-700 dark:text-rose-300">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
        EXPIRED
      </span>
    );
  }
  return (
    <Badge variant="secondary" className="font-medium uppercase tracking-wide">
      {status}
    </Badge>
  );
}

export function PaymentProgress({
  amountPaid,
  totalAmount,
  pendingAmount,
}: {
  amountPaid: number;
  totalAmount: number;
  pendingAmount: number;
}) {
  const pct = totalAmount > 0 ? Math.min(100, (amountPaid / totalAmount) * 100) : 0;
  const hasPending = pendingAmount > 0;

  return (
    <div className="min-w-[100px]">
      <div className="text-sm font-medium tabular-nums">
        {formatCurrency(amountPaid)} / {formatCurrency(totalAmount)}
      </div>
      <div
        className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            hasPending ? "bg-amber-500" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {hasPending && (
        <p className="text-xs text-amber-600 mt-0.5">
          Pending: {formatCurrency(pendingAmount)}
        </p>
      )}
    </div>
  );
}

const limit = 10;
const DEBOUNCE_MS = 300;

export function ClientsTable() {
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
      debounce((p: number, s: string, st: string) => {
        fetchClients(p, s, st);
      }, DEBOUNCE_MS),
    [fetchClients]
  );

  useEffect(() => {
    fetchClients(page, search, statusParam);
  }, [page, statusParam, fetchClients]);

  useEffect(() => {
    if (search === "") {
      setPage(1);
      fetchClients(1, "", statusParam);
    } else {
      setPage(1);
      debouncedFetch(1, search, statusParam);
    }
  }, [search]);

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

  async function handleSendReminder(client: ClientRow) {
    if (client.subscriptionStatus !== "EXPIRED") return;
    if (!client.phone?.trim()) {
      toast({
        title: "No phone number",
        description: "Add a phone number to send WhatsApp reminder.",
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
        description: "WhatsApp message sent to " + client.fullName,
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
      "Paid",
      "Total",
      "Pending",
    ];
    const rows = filteredItems.map((c) =>
      [
        c.fullName,
        c.phone ?? "",
        c.email ?? "",
        c.subscriptionStatus,
        c.subscriptionEndDate ?? "",
        c.amountPaid,
        c.totalAmount,
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
  const expiredCount = selectedClients.filter((c) => c.subscriptionStatus === "EXPIRED").length;

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
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl h-10"
            aria-label="Search clients by name"
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
                  if (c.subscriptionStatus === "EXPIRED" && c.phone?.trim())
                    handleSendReminder(c);
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
                  const expiringSoon =
                    c.subscriptionEndDate &&
                    c.subscriptionStatus === "ACTIVE" &&
                    isExpiringWithinDays(c.subscriptionEndDate, 7);
                  const isExpired = c.subscriptionStatus === "EXPIRED";
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "p-4 space-y-2 transition-colors",
                        isExpired && "bg-rose-500/5",
                        expiringSoon && !isExpired && "bg-amber-500/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-2">
                          <Link
                            href={`/dashboard/clients/${c.id}`}
                            className="font-medium hover:underline block truncate"
                          >
                            {c.fullName}
                          </Link>
                          <div className="flex flex-col gap-2">
                            <StatusBadge
                              status={c.subscriptionStatus}
                              subscriptionEndDate={c.subscriptionEndDate}
                            />
                            {c.subscriptionStatus === "EXPIRED" && (
                              <Button
                                variant={c.phone?.trim() ? "default" : "outline"}
                                size="sm"
                                className="w-fit rounded-full gap-1.5 h-8 text-xs font-medium shadow-sm transition-all hover:shadow"
                                onClick={() => handleSendReminder(c)}
                                disabled={
                                  !c.phone?.trim() || sendingReminderId === c.id
                                }
                                title={
                                  !c.phone?.trim()
                                    ? "Add phone number to send reminder"
                                    : undefined
                                }
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                {sendingReminderId === c.id ? "Sending…" : "Send reminder"}
                              </Button>
                            )}
                          </div>
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
                                <CreditCard className="h-4 w-4" /> Record payment
                              </Link>
                            </DropdownMenuItem>
                            {c.subscriptionStatus === "EXPIRED" && (
                              <DropdownMenuItem
                                onClick={() => handleSendReminder(c)}
                                disabled={!c.phone?.trim() || sendingReminderId === c.id}
                                title={!c.phone?.trim() ? "Add phone number to send reminder" : undefined}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                {sendingReminderId === c.id ? "Sending…" : "Send reminder"}
                              </DropdownMenuItem>
                            )}
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
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          Due: {c.subscriptionEndDate ? formatDate(c.subscriptionEndDate) : "—"}
                        </span>
                        <span className="font-medium text-foreground tabular-nums">
                          {formatCurrency(c.amountPaid)} / {formatCurrency(c.totalAmount)}
                        </span>
                      </div>
                      {c.pendingAmount > 0 && (
                        <p className="text-xs text-amber-600">
                          Pending: {formatCurrency(c.pendingAmount)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm" role="table" aria-label="Clients">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="w-10 p-4">
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
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/50 transition-colors select-none"
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
                      <th className="text-left p-4 font-medium hidden md:table-cell">
                        Contact
                      </th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/50 transition-colors select-none"
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
                      <th
                        className="text-right p-4 font-medium cursor-pointer hover:bg-muted/50 transition-colors select-none"
                        onClick={() => toggleSort("amount")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Paid / Total
                          {sortKey === "amount" &&
                            (sortDir === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </span>
                      </th>
                      <th className="text-right p-4 font-medium w-12">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((c, i) => {
                      const expiringSoon =
                        c.subscriptionEndDate &&
                        c.subscriptionStatus === "ACTIVE" &&
                        isExpiringWithinDays(c.subscriptionEndDate, 7);
                      const isExpired = c.subscriptionStatus === "EXPIRED";
                      const rowBg = isExpired
                        ? "bg-rose-500/5"
                        : expiringSoon
                          ? "bg-amber-500/5"
                          : i % 2 === 1
                            ? "bg-muted/20"
                            : "";

                      return (
                        <tr
                          key={c.id}
                          className={cn(
                            "border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30",
                            rowBg
                          )}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(c.id)}
                              onChange={() => toggleSelect(c.id)}
                              aria-label={`Select ${c.fullName}`}
                              className="rounded border-input"
                            />
                          </td>
                          <td className="p-4 py-5">
                            <Link
                              href={`/dashboard/clients/${c.id}`}
                              className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                            >
                              {c.fullName}
                            </Link>
                          </td>
                          <td className="p-4 py-5 hidden md:table-cell text-muted-foreground">
                            {c.phone ? (
                              <button
                                type="button"
                                onClick={() => copyPhone(c.phone!)}
                                title="Click to copy"
                                className="hover:text-foreground underline decoration-dotted focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                              >
                                {c.phone}
                              </button>
                            ) : (
                              c.email ?? "—"
                            )}
                          </td>
                          <td className="p-4 py-5 align-top">
                            <div
                              className={cn(
                                "flex flex-col gap-2 min-w-[120px]",
                                isExpired && "pl-3 border-l-2 border-rose-400/50"
                              )}
                            >
                              <StatusBadge
                                status={c.subscriptionStatus}
                                subscriptionEndDate={c.subscriptionEndDate}
                              />
                              {c.subscriptionStatus === "EXPIRED" && (
                                <Button
                                  variant={c.phone?.trim() ? "default" : "outline"}
                                  size="sm"
                                  className="w-fit rounded-full gap-1.5 h-8 text-xs font-medium shadow-sm transition-all hover:shadow"
                                  onClick={() => handleSendReminder(c)}
                                  disabled={
                                    !c.phone?.trim() || sendingReminderId === c.id
                                  }
                                  title={
                                    !c.phone?.trim()
                                      ? "Add phone number to send reminder"
                                      : undefined
                                  }
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  {sendingReminderId === c.id ? "Sending…" : "Send reminder"}
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="p-4 py-5 text-muted-foreground tabular-nums">
                            {c.subscriptionEndDate
                              ? formatDate(c.subscriptionEndDate)
                              : "—"}
                          </td>
                          <td className="p-4 py-5 text-right">
                            <PaymentProgress
                              amountPaid={c.amountPaid}
                              totalAmount={c.totalAmount}
                              pendingAmount={c.pendingAmount}
                            />
                          </td>
                          <td className="p-4 py-5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  aria-label={`Actions for ${c.fullName}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="rounded-xl w-56"
                              >
                                <DropdownMenuItem asChild className="rounded-lg">
                                  <Link
                                    href={`/dashboard/clients/${c.id}`}
                                    className="flex items-center gap-2"
                                  >
                                    <FileText className="h-4 w-4" />
                                    View profile
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="rounded-lg">
                                  <Link
                                    href={`/dashboard/clients/${c.id}`}
                                    className="flex items-center gap-2"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="rounded-lg">
                                  <Link
                                    href={`/dashboard/payments?record=${c.id}`}
                                    className="flex items-center gap-2"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                    Record payment
                                  </Link>
                                </DropdownMenuItem>
                                {c.subscriptionStatus === "EXPIRED" && (
                                  <DropdownMenuItem
                                    className="rounded-lg"
                                    onClick={() => handleSendReminder(c)}
                                    disabled={
                                      !c.phone?.trim() ||
                                      sendingReminderId === c.id
                                    }
                                    title={
                                      !c.phone?.trim()
                                        ? "Add phone number to send reminder"
                                        : undefined
                                    }
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    {sendingReminderId === c.id
                                      ? "Sending…"
                                      : "Send reminder"}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={() =>
                                    handleDelete(c.id, c.fullName)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
