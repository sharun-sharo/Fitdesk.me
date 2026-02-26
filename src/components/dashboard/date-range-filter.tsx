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
import { subDays, subMonths, format } from "date-fns";

export type DateRangePreset = "all-time" | "7d" | "30d" | "3m" | "6m" | "custom";

export type DateRange = { from: string; to: string; preset: DateRangePreset };

export const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "all-time", label: "All-time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "custom", label: "Custom range" },
];

function getRangeForPreset(preset: DateRangePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  let from: string;
  switch (preset) {
    case "all-time":
      from = "2000-01-01";
      break;
    case "7d":
      from = format(subDays(now, 7), "yyyy-MM-dd");
      break;
    case "30d":
      from = format(subDays(now, 30), "yyyy-MM-dd");
      break;
    case "3m":
      from = format(subMonths(now, 3), "yyyy-MM-dd");
      break;
    case "6m":
      from = format(subMonths(now, 6), "yyyy-MM-dd");
      break;
    default:
      from = format(subMonths(now, 6), "yyyy-MM-dd");
  }
  return { from, to };
}

type Props = {
  value: DateRange;
  onChange: (range: DateRange) => void;
};

export function DateRangeFilter({ value, onChange }: Props) {
  function handlePresetChange(preset: DateRangePreset) {
    if (preset === "custom") {
      onChange({ ...value, preset: "custom" });
      return;
    }
    const { from, to } = getRangeForPreset(preset);
    onChange({ from, to, preset });
  }

  function handleCustomFromTo(from: string, to: string) {
    onChange({ from, to, preset: "custom" });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select
          value={value.preset}
          onValueChange={(v) => handlePresetChange(v as DateRangePreset)}
        >
          <SelectTrigger className="w-[160px] rounded-xl">
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
      {value.preset === "custom" && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-[160px]">
            <Label className="text-xs sr-only">From</Label>
            <DatePickerField
              value={value.from || undefined}
              onChange={(d) => handleCustomFromTo(d ? format(d, "yyyy-MM-dd") : "", value.to)}
              placeholder="mm/dd/yyyy"
            />
          </div>
          <div className="w-[160px]">
            <Label className="text-xs sr-only">To</Label>
            <DatePickerField
              value={value.to || undefined}
              onChange={(d) => handleCustomFromTo(value.from, d ? format(d, "yyyy-MM-dd") : "")}
              placeholder="mm/dd/yyyy"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function getDefaultDateRange(): DateRange {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  return { from: "2000-01-01", to, preset: "all-time" };
}
