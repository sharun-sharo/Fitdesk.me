"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { RevenuePoint } from "@/hooks/use-dashboard-stats";
import { ChartsDateRangeFilter } from "./charts-date-range-filter";

type Props = {
  data: RevenuePoint[];
  rangeLabel?: string;
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg animate-[scaleIn_0.25s_ease-out]">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{formatCurrency(value)}</p>
    </div>
  );
}

type PaymentRow = { id: string; clientName: string; amount: number; paymentDate: string };

export function RevenueChartEnhanced({
  data,
  rangeLabel,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [periodLabel, setPeriodLabel] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  useEffect(() => {
    if (!modalOpen || !periodStart || !periodEnd) return;
    setLoadingBreakdown(true);
    fetch(
      `/api/dashboard/payments?from=${periodStart}&to=${periodEnd}`
    )
      .then((res) => res.json())
      .then((d) => {
        setPayments(d.payments ?? []);
      })
      .catch(() => setPayments([]))
      .finally(() => setLoadingBreakdown(false));
  }, [modalOpen, periodStart, periodEnd]);

  function handleBarClick(entry: RevenuePoint & { periodStart?: string; periodEnd?: string }) {
    if (entry.periodStart && entry.periodEnd) {
      setPeriodLabel(entry.month);
      setPeriodStart(entry.periodStart.slice(0, 10));
      setPeriodEnd(entry.periodEnd.slice(0, 10));
      setModalOpen(true);
    }
  }

  const totalInModal = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Revenue</CardTitle>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {rangeLabel ? `Showing: ${rangeLabel}` : ""} · Monthly · Click a bar for breakdown
            </p>
          </div>
          <div>
            <ChartsDateRangeFilter />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                <XAxis dataKey="month" className="text-xs font-medium" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs font-medium" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  name="Revenue"
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                  onClick={(data: unknown) => {
                    const payload = (data as { payload?: RevenuePoint })?.payload ?? data;
                    const p = payload as RevenuePoint & { periodStart?: string; periodEnd?: string };
                    if (p?.periodStart && p?.periodEnd) handleBarClick(p);
                  }}
                >
                  {data.map((_, i) => (
                    <Cell key={i} className="cursor-pointer transition-opacity duration-200 hover:opacity-90" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Revenue breakdown — {periodLabel}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1 min-h-0">
            {loadingBreakdown ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Date</th>
                    <th className="text-left py-2 font-medium">Client</th>
                    <th className="text-right py-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-2">{formatDate(p.paymentDate)}</td>
                      <td className="py-2">{p.clientName}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loadingBreakdown && payments.length > 0 && (
              <p className="text-sm font-medium mt-2 pt-2 border-t">
                Total: {formatCurrency(totalInModal)}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
