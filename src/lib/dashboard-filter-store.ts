"use client";

import { create } from "zustand";
import { subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export type DashboardRangePreset = "all" | "this_year" | "this_month" | "last_month" | "custom";

export type DashboardFilterState = {
  range: DashboardRangePreset;
  from: Date | null;
  to: Date | null;
};

function getDatesForPreset(preset: DashboardRangePreset): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case "all":
      return { from: new Date(2000, 0, 1), to: endOfDay(now) };
    case "this_year":
      return { from: startOfDay(startOfYear(now)), to: endOfDay(now) };
    case "this_month":
      return { from: startOfDay(startOfMonth(now)), to: endOfDay(now) };
    case "last_month": {
      const last = subMonths(now, 1);
      return { from: startOfDay(startOfMonth(last)), to: endOfDay(endOfMonth(last)) };
    }
    default:
      return { from: startOfDay(startOfMonth(now)), to: endOfDay(now) };
  }
}

type Store = DashboardFilterState & {
  setRange: (range: DashboardRangePreset) => void;
  setCustomRange: (from: Date, to: Date) => void;
  getApiParams: () => { from: string; to: string };
};

export const dashboardFilterStore = create<Store>((set, get) => ({
  range: "all",
  from: null,
  to: null,
  setRange: (range) => {
    if (range === "custom") {
      const now = new Date();
      const from = startOfDay(subMonths(now, 1));
      const to = endOfDay(now);
      set({ range, from, to });
      return;
    }
    const { from, to } = getDatesForPreset(range);
    set({ range, from, to });
  },
  setCustomRange: (from, to) => set({ range: "custom", from, to }),
  getApiParams: () => {
    const s = get();
    if (s.range === "custom" && s.from && s.to) {
      return {
        from: s.from.toISOString().slice(0, 10),
        to: s.to.toISOString().slice(0, 10),
      };
    }
    const { from, to } = getDatesForPreset(s.range);
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    };
  },
}));

export function getRangeLabel(
  range: DashboardRangePreset,
  from: Date | null,
  to: Date | null
): string {
  const labels: Record<Exclude<DashboardRangePreset, "custom">, string> = {
    all: "All-time",
    this_year: "This year",
    this_month: "This month",
    last_month: "Last month",
  };
  if (range === "custom" && from && to) {
    const f = from.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const t = to.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return `${f} – ${t}`;
  }
  return labels[range] ?? "This month";
}
