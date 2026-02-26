"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import type { DashboardRangePreset } from "@/lib/dashboard-filter-store";

const PRESETS: { value: DashboardRangePreset; label: string }[] = [
  { value: "all", label: "All-time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "custom", label: "Custom range" },
];

export function ChartsDateRangeFilter() {
  const { range, from, to, setRange, setCustomRange } = useDashboardFilters();

  const customFromStr = from?.toISOString().slice(0, 10) ?? "";
  const customToStr = to?.toISOString().slice(0, 10) ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={range} onValueChange={(v) => setRange(v as DashboardRangePreset)}>
          <SelectTrigger className="w-[160px] rounded-xl transition-colors hover:border-primary/30 focus:ring-2 focus:ring-primary/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {range === "custom" && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-[160px]">
            <Label className="text-xs sr-only">From</Label>
            <DatePickerField
              value={from ?? undefined}
              onChange={(d) => setCustomRange(d ?? new Date(), to ?? new Date())}
              placeholder="mm/dd/yyyy"
            />
          </div>
          <div className="w-[160px]">
            <Label className="text-xs sr-only">To</Label>
            <DatePickerField
              value={to ?? undefined}
              onChange={(d) => setCustomRange(from ?? new Date(), d ?? new Date())}
              placeholder="mm/dd/yyyy"
            />
          </div>
        </div>
      )}
    </div>
  );
}
