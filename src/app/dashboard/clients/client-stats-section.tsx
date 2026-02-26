"use client";

import { useState, useEffect } from "react";
import { ClientStatsCards } from "./client-stats-cards";

type Stats = {
  totalClients: number;
  activeClients: number;
  expiredClients: number;
  pendingPayments: number;
} | null;

export function ClientStatsSection() {
  const [stats, setStats] = useState<Stats>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) return;
        const data = await res.json();
        const k = data.kpis ?? {};
        if (!cancelled) {
          setStats({
            totalClients: k.totalClients ?? 0,
            activeClients: k.activeClients ?? 0,
            expiredClients: k.expiredClients ?? 0,
            pendingPayments: k.pendingPayments ?? 0,
          });
        }
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <ClientStatsCards stats={stats} loading={loading} />;
}
