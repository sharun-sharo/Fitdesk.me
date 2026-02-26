"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  dashboardFilterStore,
  getRangeLabel,
  type DashboardRangePreset,
} from "@/lib/dashboard-filter-store";

const RANGE_PARAM = "range";
const VALID_RANGES: DashboardRangePreset[] = ["all", "this_year", "this_month", "last_month", "custom"];

export function useDashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const range = dashboardFilterStore((s) => s.range);
  const from = dashboardFilterStore((s) => s.from);
  const to = dashboardFilterStore((s) => s.to);
  const getApiParams = dashboardFilterStore((s) => s.getApiParams);

  useEffect(() => {
    const urlRange = searchParams.get(RANGE_PARAM) as DashboardRangePreset | null;
    if (urlRange && VALID_RANGES.includes(urlRange)) {
      if (urlRange === "custom") {
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");
        if (fromParam && toParam) {
          dashboardFilterStore.getState().setCustomRange(new Date(fromParam), new Date(toParam));
        }
      } else {
        dashboardFilterStore.getState().setRange(urlRange);
      }
    } else if (pathname === "/dashboard") {
      dashboardFilterStore.getState().setRange("all");
      router.replace("/dashboard?range=all", { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const updateUrl = useCallback(
    (newRange: DashboardRangePreset, customFrom?: string, customTo?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(RANGE_PARAM, newRange);
      if (newRange === "custom" && customFrom && customTo) {
        params.set("from", customFrom);
        params.set("to", customTo);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setRange = useCallback(
    (r: DashboardRangePreset) => {
      dashboardFilterStore.getState().setRange(r);
      updateUrl(r);
    },
    [updateUrl]
  );

  const setCustomRange = useCallback(
    (fromDate: Date, toDate: Date) => {
      dashboardFilterStore.getState().setCustomRange(fromDate, toDate);
      updateUrl(
        "custom",
        fromDate.toISOString().slice(0, 10),
        toDate.toISOString().slice(0, 10)
      );
    },
    [updateUrl]
  );

  useEffect(() => {
    const onPopState = () => {
      const urlRange = new URLSearchParams(window.location.search).get(RANGE_PARAM) as DashboardRangePreset | null;
      if (urlRange && VALID_RANGES.includes(urlRange)) {
        if (urlRange === "custom") {
          const fromParam = new URLSearchParams(window.location.search).get("from");
          const toParam = new URLSearchParams(window.location.search).get("to");
          if (fromParam && toParam) {
            dashboardFilterStore.getState().setCustomRange(new Date(fromParam), new Date(toParam));
          }
        } else {
          dashboardFilterStore.getState().setRange(urlRange);
        }
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const apiParams = getApiParams();
  const rangeLabel = getRangeLabel(range, from, to);

  return {
    range,
    from,
    to,
    setRange,
    setCustomRange,
    apiParams: { from: apiParams.from, to: apiParams.to },
    rangeLabel,
  };
}
