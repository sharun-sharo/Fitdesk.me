"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import {
  Plus,
  IndianRupee,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  Download,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ClientOption = { id: string; fullName: string; phone: string | null };
type PaymentRow = {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
};

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer", "Other"];

type DatePreset = "today" | "week" | "month" | "all" | "custom";

const PRESETS: { id: DatePreset; label: string; getRange: () => { from: string; to: string } }[] = [
  {
    id: "today",
    label: "Today",
    getRange: () => ({
      from: format(startOfDay(new Date()), "yyyy-MM-dd"),
      to: format(endOfDay(new Date()), "yyyy-MM-dd"),
    }),
  },
  {
    id: "week",
    label: "This Week",
    getRange: () => ({
      from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
      to: format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    }),
  },
  {
    id: "month",
    label: "This Month",
    getRange: () => ({
      from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    }),
  },
  { id: "all", label: "All Time", getRange: () => ({ from: "", to: "" }) },
  { id: "custom", label: "Custom Range", getRange: () => ({ from: "", to: "" }) },
];

const PAGE_SIZE = 10;

function MethodBadge({ method }: { method: string | null }) {
  if (!method) return <span className="text-muted-foreground text-sm">—</span>;
  const style =
    method === "UPI"
      ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20"
      : method === "Card"
        ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
        : method === "Cash"
          ? "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20"
          : method === "Bank Transfer"
            ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20"
            : "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("font-normal text-xs shrink-0", style)}>
      {method}
    </Badge>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    revenueThisMonth: number;
    revenueGrowthPercent: number;
    pendingPayments: number;
  } | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [recordOpen, setRecordOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formClientId, setFormClientId] = useState("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formMethod, setFormMethod] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [gym, setGym] = useState<{
    name: string;
    invoiceLogoUrl: string | null;
    invoiceAddress?: string | null;
    invoicePhone?: string | null;
    invoiceEmail?: string | null;
    gstNumber?: string | null;
  } | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const { toast } = useToast();
  const openedFromQuery = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get("record");
    if (recordId && !openedFromQuery.current) {
      openedFromQuery.current = true;
      setFormClientId(recordId);
      setRecordOpen(true);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/dashboard/payments?${params}`);
      if (!res.ok) throw new Error("Failed to load payments");
      const data = await res.json();
      setPayments(data.payments ?? []);
      setTotalRevenue(data.totalRevenue ?? 0);
    } catch {
      toast({ title: "Error", description: "Could not load payments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [from, to, toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) return;
        const data = await res.json();
        const k = data.kpis ?? {};
        setStats({
          revenueThisMonth: k.revenueThisMonth ?? 0,
          revenueGrowthPercent: k.revenueGrowthPercent ?? 0,
          pendingPayments: k.pendingPayments ?? 0,
        });
      } catch {
        setStats(null);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/dashboard/clients?limit=500");
      if (!res.ok) return;
      const data = await res.json();
      setClients(
        (data.items ?? []).map((c: { id: string; fullName: string; phone?: string | null }) => ({
          id: c.id,
          fullName: c.fullName,
          phone: c.phone ?? null,
        }))
      );
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/dashboard/gym");
      if (!res.ok) return;
      const data = await res.json();
      setGym({
        name: data.name ?? "",
        invoiceLogoUrl: data.invoiceLogoUrl ?? null,
        invoiceAddress: data.invoiceAddress ?? null,
        invoicePhone: data.invoicePhone ?? null,
        invoiceEmail: data.invoiceEmail ?? null,
        gstNumber: data.gstNumber ?? null,
      });
    })();
  }, []);

  const filteredPayments = useMemo(() => {
    let list = [...payments];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.clientName.toLowerCase().includes(q) || (p.clientPhone && p.clientPhone.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "date") {
        return mul * (new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
      }
      return mul * (a.amount - b.amount);
    });
    return list;
  }, [payments, search, sortKey, sortDir]);

  const filteredClients = useMemo(() => {
    const q = clientSearchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.phone && c.phone.replace(/\s/g, "").toLowerCase().includes(q.replace(/\s/g, "")))
    );
  }, [clients, clientSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const paginatedPayments = useMemo(
    () => filteredPayments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPayments, page]
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSort = (key: "date" | "amount") => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "desc");
    }
    setPage(1);
  };

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!formClientId || !formAmount || Number(formAmount) <= 0) {
      toast({
        title: "Invalid",
        description: "Select a client and enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: formClientId,
          amount: Number(formAmount),
          paymentDate: formDate || new Date().toISOString().slice(0, 10),
          paymentMethod: formMethod || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to record payment");
      }
      toast({ title: "Success", description: "Payment recorded" });
      setRecordOpen(false);
      setFormClientId("");
      setFormAmount("");
      setFormDate(new Date().toISOString().slice(0, 10));
      setFormMethod("");
      fetchPayments();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Could not record payment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadInvoice(p: PaymentRow) {
    if (!gym) {
      toast({ title: "Loading", description: "Gym details loading. Please try again in a moment.", variant: "destructive" });
      return;
    }
    setDownloadingInvoiceId(p.id);
    try {
      await generateInvoicePdf(
        {
          id: p.id,
          clientName: p.clientName,
          clientPhone: p.clientPhone,
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
        },
        gym
      );
      toast({ title: "Download started", description: "Invoice PDF saved." });
    } catch (e) {
      toast({ title: "Download failed", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setDownloadingInvoiceId(null);
    }
  }

  function exportCSV() {
    const headers = ["Date", "Client", "Phone", "Method", "Amount"];
    const rows = filteredPayments.map((p) =>
      [
        formatDate(p.paymentDate),
        p.clientName,
        p.clientPhone ?? "",
        p.paymentMethod ?? "",
        p.amount,
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export downloaded" });
  }

  const rangeLabel = from || to ? `${from ? format(new Date(from), "MMM d") : "…"} – ${to ? format(new Date(to), "MMM d, yyyy") : "…"}` : "All time";

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-8">
      {/* Header */}
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Payments</span>
        </nav>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
            <p className="text-muted-foreground mt-1">Record and view payment history</p>
          </div>
          <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="rounded-xl gap-2 shadow-md hover:shadow-lg transition-shadow bg-primary hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                Record payment
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <Label>Client</Label>
                  <DropdownMenu
                    open={clientDropdownOpen}
                    onOpenChange={(open) => {
                      setClientDropdownOpen(open);
                      if (!open) setClientSearchQuery("");
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-between rounded-xl mt-1 font-normal h-10",
                          !formClientId && "text-muted-foreground"
                        )}
                      >
                        <span>
                          {formClientId
                            ? clients.find((c) => c.id === formClientId)?.fullName ?? "Select client"
                            : "Select client"}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px] p-0">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name or number"
                            value={clientSearchQuery}
                            onChange={(e) => setClientSearchQuery(e.target.value)}
                            className="pl-8 h-9 rounded-lg"
                            onPointerDown={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-[220px] overflow-auto">
                        {filteredClients.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">No clients found</div>
                        ) : (
                          filteredClients.map((c) => (
                            <DropdownMenuItem
                              key={c.id}
                              onSelect={() => {
                                setFormClientId(c.id);
                                setClientDropdownOpen(false);
                              }}
                              className="cursor-pointer flex items-center gap-2"
                            >
                              <span className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                                <span>{c.fullName}</span>
                                {c.phone ? (
                                  <span className="text-xs text-muted-foreground">{c.phone}</span>
                                ) : null}
                              </span>
                              {formClientId === c.id ? (
                                <span className="text-primary shrink-0">✓</span>
                              ) : null}
                            </DropdownMenuItem>
                          ))
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <DatePickerField
                    value={formDate || undefined}
                    onChange={(d) => setFormDate(d ? format(d, "yyyy-MM-dd") : "")}
                    placeholder="mm/dd/yyyy"
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Method (optional)</Label>
                  <Select value={formMethod} onValueChange={setFormMethod}>
                    <SelectTrigger className="rounded-xl mt-1">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => setRecordOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="rounded-xl">
                    {submitting ? "Saving…" : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metric cards grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Revenue
                </p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold mt-1 tabular-nums">{formatCurrency(totalRevenue)}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{rangeLabel}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  This Month
                </p>
                {stats === null ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold mt-1 tabular-nums">
                    {formatCurrency(stats?.revenueThisMonth ?? 0)}
                  </p>
                )}
                {stats != null && stats.revenueGrowthPercent !== undefined && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-xs font-medium mt-1",
                      stats.revenueGrowthPercent >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {stats.revenueGrowthPercent >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {stats.revenueGrowthPercent >= 0 ? "+" : ""}
                    {stats.revenueGrowthPercent.toFixed(1)}% vs last month
                  </span>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Outstanding Dues
                </p>
                {stats === null ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold mt-1 tabular-nums">
                    {formatCurrency(stats?.pendingPayments ?? 0)}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Transactions
                </p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold mt-1 tabular-nums">{payments.length}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">In selected range</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Revenue card with date filters */}
      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <IndianRupee className="h-5 w-5 text-primary" />
            Revenue in range
          </CardTitle>
          <div className="flex flex-wrap gap-2 pt-2">
            {PRESETS.filter((p) => p.id !== "custom").map((p) => (
              <Button
                key={p.id}
                variant={datePreset === p.id ? "default" : "outline"}
                size="sm"
                className="rounded-lg"
                onClick={() => {
                  const { from: f, to: t } = p.getRange();
                  setFrom(f);
                  setTo(t);
                  setDatePreset(p.id);
                }}
              >
                {p.label}
              </Button>
            ))}
            <Button
              variant={datePreset === "custom" ? "default" : "outline"}
              size="sm"
              className="rounded-lg"
              onClick={() => setDatePreset("custom")}
            >
              Custom Range
            </Button>
          </div>
          {(datePreset === "custom" || (from && to)) && (
            <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-border/50 mt-2">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">From</Label>
                <DatePickerField
                  value={from || undefined}
                  onChange={(d) => {
                    setFrom(d ? format(d, "yyyy-MM-dd") : "");
                    setDatePreset("custom");
                  }}
                  placeholder="mm/dd/yyyy"
                  className="w-40 rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">To</Label>
                <DatePickerField
                  value={to || undefined}
                  onChange={(d) => {
                    setTo(d ? format(d, "yyyy-MM-dd") : "");
                    setDatePreset("custom");
                  }}
                  placeholder="mm/dd/yyyy"
                  className="w-40 rounded-xl"
                />
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <Skeleton className="h-12 w-40 rounded-xl" />
          ) : (
            <p className="text-3xl font-bold tabular-nums">{formatCurrency(totalRevenue)}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">{rangeLabel}</p>
        </CardContent>
      </Card>

      {/* Payment history table */}
      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment history
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px] sm:min-w-0 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client or phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl h-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={exportCSV}
                disabled={filteredPayments.length === 0}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="rounded-full bg-muted/50 p-6 mb-4">
                <CreditCard className="h-14 w-14 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No payments yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Record a payment to see history here. Use the button above to add your first payment.
              </p>
              <Button
                className="mt-6 rounded-xl"
                onClick={() => setRecordOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Record payment
              </Button>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">No payments match your search.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-px">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th
                        className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/60 hover:text-foreground transition-colors rounded-tl-xl select-none"
                        onClick={() => handleSort("date")}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          Date
                          {sortKey === "date" &&
                            (sortDir === "desc" ? (
                              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                            ) : (
                              <ChevronUp className="h-3.5 w-3.5 opacity-70" />
                            ))}
                        </span>
                      </th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Client
                      </th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Method
                      </th>
                      <th
                        className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/60 hover:text-foreground transition-colors select-none"
                        onClick={() => handleSort("amount")}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          Amount
                          {sortKey === "amount" &&
                            (sortDir === "desc" ? (
                              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                            ) : (
                              <ChevronUp className="h-3.5 w-3.5 opacity-70" />
                            ))}
                        </span>
                      </th>
                      <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-36 rounded-tr-xl">
                        Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((p, i) => (
                      <tr
                        key={p.id}
                        className={cn(
                          "border-b border-border/50 last:border-0 transition-colors duration-150 hover:bg-muted/40",
                          i % 2 === 1 && "bg-muted/10"
                        )}
                      >
                        <td className="py-3.5 px-4 align-middle text-muted-foreground tabular-nums text-[13px]">
                          {formatDate(p.paymentDate)}
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-foreground">{p.clientName}</span>
                            {p.clientPhone && (
                              <span className="text-muted-foreground text-xs tracking-tight">
                                {p.clientPhone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          <Badge variant="success" className="font-medium text-xs px-2.5 py-0.5">
                            Paid
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          <MethodBadge method={p.paymentMethod} />
                        </td>
                        <td className="py-3.5 px-4 text-right align-middle font-semibold tabular-nums text-foreground">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right align-middle">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg gap-1.5 h-8 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                            disabled={downloadingInvoiceId === p.id}
                            onClick={() => handleDownloadInvoice(p)}
                            title="Download invoice PDF"
                          >
                            <FileText className="h-4 w-4 shrink-0" />
                            {downloadingInvoiceId === p.id ? "Downloading…" : "Download"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border/50 bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredPayments.length)} of{" "}
                    {filteredPayments.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-2 tabular-nums">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
