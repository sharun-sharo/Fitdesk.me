"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Download,
  FileBarChart,
  Users,
  IndianRupee,
  CreditCard,
  UserCheck,
  UserPlus,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type RevenueRow = {
  Date: string;
  Amount: number;
  "Payment Method": string;
};

type ClientRow = {
  Name: string;
  Phone: string;
  Email: string;
  "Join Date": string;
  "Subscription End": string;
  Status: string;
  "Total Amount": number;
  "Amount Paid": number;
};

type DatePreset = "today" | "week" | "month" | "lastMonth" | "all";

const PRESETS: { id: DatePreset; label: string; getRange: () => { start: string; end: string } }[] = [
  { id: "today", label: "Today", getRange: () => ({ start: format(startOfDay(new Date()), "yyyy-MM-dd"), end: format(endOfDay(new Date()), "yyyy-MM-dd") }) },
  { id: "week", label: "This Week", getRange: () => ({ start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd") }) },
  { id: "month", label: "This Month", getRange: () => ({ start: format(startOfMonth(new Date()), "yyyy-MM-dd"), end: format(endOfMonth(new Date()), "yyyy-MM-dd") }) },
  { id: "lastMonth", label: "Last Month", getRange: () => ({ start: format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"), end: format(endOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd") }) },
  { id: "all", label: "All Time", getRange: () => ({ start: "", end: "" }) },
];

type Summary = {
  totalRevenue: number;
  totalPayments: number;
  clientsInRange: number;
  activeInRange: number;
} | null;

function getPresetFromRange(start: string, end: string): DatePreset | null {
  const now = new Date();
  const todayStart = format(startOfDay(now), "yyyy-MM-dd");
  const todayEnd = format(endOfDay(now), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  if (start === todayStart && end === todayEnd) return "today";
  if (start === weekStart && end === weekEnd) return "week";
  if (start === monthStart && end === monthEnd) return "month";
  if (start === lastMonthStart && end === lastMonthEnd) return "lastMonth";
  if (!start && !end) return "all";
  return null;
}

function formatRangeLabel(start: string, end: string): string {
  if (!start && !end) return "All time";
  if (start && !end) return `From ${format(new Date(start), "MMM d, yyyy")}`;
  if (!start && end) return `Until ${format(new Date(end), "MMM d, yyyy")}`;
  return `${format(new Date(start), "MMM d, yyyy")} – ${format(new Date(end), "MMM d, yyyy")}`;
}

export function ReportsSection() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [exportBusy, setExportBusy] = useState<"revenue-xlsx" | "revenue-csv" | "clients-xlsx" | "clients-csv" | null>(null);
  const [revenuePreview, setRevenuePreview] = useState<RevenueRow[]>([]);
  const [clientsPreview, setClientsPreview] = useState<ClientRow[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [summary, setSummary] = useState<Summary>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const { toast } = useToast();

  const fetchReportData = useCallback(async () => {
    const s = start || undefined;
    const e = end || undefined;
    setSummaryLoading(true);
    setRevenueLoading(true);
    setClientsLoading(true);
    try {
      const params = new URLSearchParams();
      if (s) params.set("start", s);
      if (e) params.set("end", e);
      const [revRes, clRes] = await Promise.all([
        fetch(`/api/dashboard/reports/revenue?${params}`),
        fetch(`/api/dashboard/reports/clients?${params}`),
      ]);
      const revData = await revRes.json();
      const clData = await clRes.json();
      const previewRev = revData.preview || [];
      const previewCl = clData.preview || [];
      const totalRevenue = previewRev.reduce((sum: number, r: RevenueRow) => sum + (r.Amount ?? 0), 0);
      const totalPayments = revData.total ?? previewRev.length;
      const clientsInRange = clData.total ?? previewCl.length;
      const activeInRange = previewCl.filter((c: ClientRow) => c.Status === "ACTIVE").length;
      setRevenuePreview(previewRev);
      setClientsPreview(previewCl);
      setSummary({
        totalRevenue,
        totalPayments,
        clientsInRange,
        activeInRange,
      });
    } catch {
      setSummary(null);
      setRevenuePreview([]);
      setClientsPreview([]);
    } finally {
      setSummaryLoading(false);
      setRevenueLoading(false);
      setClientsLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  async function handleExport(type: "revenue" | "clients", format: "xlsx" | "csv") {
    const key = `${type}-${format}` as const;
    setExportBusy(key);
    try {
      const s = start || undefined;
      const e = end || undefined;
      const params = new URLSearchParams({ export: format });
      if (s) params.set("start", s);
      if (e) params.set("end", e);
      const res = await fetch(`/api/dashboard/reports/${type}?${params}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format;
      a.download =
        res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "").trim() ||
        `${type}-report.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Download complete", description: "Your report has been saved." });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExportBusy(null);
    }
  }

  const loading = exportBusy !== null;
  const activePreset = getPresetFromRange(start, end);
  const hasRevenuePreview = revenuePreview.length > 0;
  const hasClientsPreview = clientsPreview.length > 0;
  const revenueSum = revenuePreview.reduce((s, r) => s + r.Amount, 0);

  return (
    <div className="space-y-8">
      {/* KPI Strip */}
      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="sr-only">Summary</h2>
        {summaryLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-semibold tabular-nums">
                  {summary ? formatCurrency(summary.totalRevenue) : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Payments</p>
                <p className="text-lg font-semibold tabular-nums">{summary ? summary.totalPayments : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active (in range)</p>
                <p className="text-lg font-semibold tabular-nums">{summary ? summary.activeInRange : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Clients in range</p>
                <p className="text-lg font-semibold tabular-nums">{summary ? summary.clientsInRange : "—"}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Date Range */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Date Range</CardTitle>
          <p className="text-sm text-muted-foreground">
            Filter report data by payment date (revenue) or join date (clients). Summary above updates with the
            selected range.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.id}
                variant={activePreset === p.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const { start: s, end: e } = p.getRange();
                  setStart(s);
                  setEnd(e);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-2">
              <Label>Start</Label>
              <DatePickerField
                value={start || undefined}
                onChange={(d) => setStart(d ? format(d, "yyyy-MM-dd") : "")}
                placeholder="mm/dd/yyyy"
              />
            </div>
            <div className="grid gap-2">
              <Label>End</Label>
              <DatePickerField
                value={end || undefined}
                onChange={(d) => setEnd(d ? format(d, "yyyy-MM-dd") : "")}
                placeholder="mm/dd/yyyy"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing: <span className="font-medium text-foreground">{formatRangeLabel(start, end)}</span>
          </p>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Report Card */}
        <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileBarChart className="h-5 w-5 text-primary" />
                Revenue Report
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={loading || revenueLoading}>
                    <Download className="mr-1.5 h-4 w-4" />
                    Download
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("revenue", "xlsx")} disabled={exportBusy === "revenue-xlsx"}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      {exportBusy === "revenue-xlsx" ? "Exporting…" : "XLSX"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("revenue", "csv")} disabled={exportBusy === "revenue-csv"}>
                      <FileBarChart className="mr-2 h-4 w-4" />
                      {exportBusy === "revenue-csv" ? "Exporting…" : "CSV"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {hasRevenuePreview && (
              <p className="text-sm text-muted-foreground">
                {formatCurrency(revenueSum)} total revenue · {revenuePreview.length} record
                {revenuePreview.length !== 1 ? "s" : ""} in preview
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto max-h-64 rounded-md border">
              {revenueLoading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : !hasRevenuePreview ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-foreground">No revenue in this range</p>
                  <p className="text-xs text-muted-foreground mt-1">Change the date range to see data.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-right p-2 font-medium">Amount</th>
                      <th className="text-left p-2 font-medium">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenuePreview.map((r, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-2">{r.Date}</td>
                        <td className="p-2 text-right tabular-nums">{formatCurrency(r.Amount)}</td>
                        <td className="p-2">{r["Payment Method"] || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clients Report Card */}
        <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Clients Report
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={loading || clientsLoading}>
                    <Download className="mr-1.5 h-4 w-4" />
                    Download
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("clients", "xlsx")} disabled={exportBusy === "clients-xlsx"}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      {exportBusy === "clients-xlsx" ? "Exporting…" : "XLSX"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("clients", "csv")} disabled={exportBusy === "clients-csv"}>
                      <FileBarChart className="mr-2 h-4 w-4" />
                      {exportBusy === "clients-csv" ? "Exporting…" : "CSV"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {hasClientsPreview && (
              <p className="text-sm text-muted-foreground">
                {clientsPreview.length} client{clientsPreview.length !== 1 ? "s" : ""} in preview
                {summary ? ` · ${summary.activeInRange} active` : ""}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto max-h-64 rounded-md border">
              {clientsLoading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : !hasClientsPreview ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-foreground">No clients in this range</p>
                  <p className="text-xs text-muted-foreground mt-1">Change the date range to see data.</p>
                </div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-right p-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientsPreview.slice(0, 20).map((c, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-2">{c.Name}</td>
                          <td className="p-2">{c.Status}</td>
                          <td className="p-2 text-right tabular-nums">{formatCurrency(c["Total Amount"])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {clientsPreview.length > 20 && (
                    <p className="text-xs text-muted-foreground p-2 border-t bg-muted/30">
                      Showing first 20 of {clientsPreview.length}
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
