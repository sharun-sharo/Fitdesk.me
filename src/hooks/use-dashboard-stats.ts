"use client";

import { useState, useEffect, useCallback } from "react";

export type RecentActivityItem = {
  type: "new_client" | "payment_received" | "subscription_expired" | "invoice_generated";
  label: string;
  timestamp: string;
  id?: string;
};

export type RevenuePoint = {
  month: string;
  revenue: number;
  periodStart?: string;
  periodEnd?: string;
};

export type DashboardStats = {
  kpis: {
    totalClients: number;
    activeClients: number;
    expiredClients: number;
    revenueThisMonth: number;
    revenueThisYear: number;
    pendingPayments: number;
    revenueInRange?: number;
    clientsThisMonth: number;
    clientsLastMonth: number;
    revenueGrowthPercent: number;
    clientGrowthPercent: number;
  };
  monthlyRevenue: RevenuePoint[];
  clientGrowth: { month: string; clients: number }[];
  activeVsExpired: { name: string; value: number }[];
  recentActivity: RecentActivityItem[];
  expiringSoon: { id: string; fullName: string; subscriptionEndDate: string }[];
};

export type DateRangePreset = "7d" | "30d" | "3m" | "6m" | "custom";
export type ChartGranularity = "monthly" | "weekly";

export function useDashboardStats(
  range: { from: string; to: string } | null,
  granularity: ChartGranularity
) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (range?.from) params.set("from", range.from);
      if (range?.to) params.set("to", range.to);
      params.set("granularity", granularity);
      const res = await fetch(`/api/dashboard/stats?${params}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load dashboard");
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [range?.from, range?.to, granularity]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}
