"use client";

import * as React from "react";
import { format, isValid, subYears, addYears } from "date-fns";
import { DayPicker, useDayPicker, Dropdown as RDPDropdown } from "react-day-picker";
import type { DropdownProps } from "react-day-picker";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const DISPLAY_FORMAT = "MM/dd/yyyy";

const now = new Date();
const DEFAULT_START = subYears(now, 120);
const DEFAULT_END = addYears(now, 10);

const DOB_MIN_DATE = new Date(1900, 0, 1);
function getDOBMaxDate() {
  return new Date();
}

const DROPDOWN_LIST_MAX_HEIGHT = "220px";

/** Compact scrollable dropdown for DOB: month (12 items) and year list, ~8–12 visible at a time */
function DOBCompactDropdown(props: DropdownProps) {
  const { fromDate, toDate, formatters, locale } = useDayPicker();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (props.name === "months") {
    const months = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1));
    const value = Number(props.value);
    const handleSelect = (monthIndex: number) => {
      props.onChange?.({ target: { value: String(monthIndex) } } as React.ChangeEvent<HTMLSelectElement>);
      setOpen(false);
    };
    return (
      <div ref={ref} className="relative inline-flex">
        <button
          type="button"
          aria-label={props["aria-label"]}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "inline-flex items-center rounded border border-transparent px-1 py-0.5 text-sm font-medium",
            "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          )}
        >
          {formatters?.formatMonthCaption?.(months[value], { locale }) ?? months[value].toLocaleString("default", { month: "long" })}
          <ChevronDown className="ml-0.5 h-3.5 w-3.5 opacity-70" aria-hidden />
        </button>
        {open && (
          <div
            role="listbox"
            className="absolute left-0 top-full z-[300] mt-1 min-w-[120px] overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg"
            style={{ maxHeight: DROPDOWN_LIST_MAX_HEIGHT }}
          >
            {months.map((m, i) => (
              <button
                key={i}
                type="button"
                role="option"
                aria-selected={i === value}
                onClick={() => handleSelect(i)}
                className={cn(
                  "w-full px-3 py-1.5 text-left text-sm",
                  i === value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {formatters?.formatMonthCaption?.(m, { locale }) ?? m.toLocaleString("default", { month: "long" })}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (props.name === "years") {
    const startYear = fromDate?.getFullYear() ?? 1900;
    const endYear = toDate?.getFullYear() ?? getDOBMaxDate().getFullYear();
    const years = React.useMemo(() => {
      const list: number[] = [];
      for (let y = endYear; y >= startYear; y--) list.push(y);
      return list;
    }, [startYear, endYear]);
    const value = Number(props.value ?? endYear);
    const handleSelect = (year: number) => {
      props.onChange?.({ target: { value: String(year) } } as React.ChangeEvent<HTMLSelectElement>);
      setOpen(false);
    };
    return (
      <div ref={ref} className="relative inline-flex">
        <button
          type="button"
          aria-label={props["aria-label"]}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "inline-flex items-center rounded border border-transparent px-1 py-0.5 text-sm font-medium",
            "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          )}
        >
          {formatters?.formatYearCaption?.(new Date(value, 0, 1), { locale }) ?? value}
          <ChevronDown className="ml-0.5 h-3.5 w-3.5 opacity-70" aria-hidden />
        </button>
        {open && (
          <div
            role="listbox"
            className="absolute left-0 top-full z-[300] mt-1 min-w-[72px] overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg"
            style={{ maxHeight: DROPDOWN_LIST_MAX_HEIGHT }}
          >
            {years.map((y) => (
              <button
                key={y}
                type="button"
                role="option"
                aria-selected={y === value}
                onClick={() => handleSelect(y)}
                className={cn(
                  "w-full px-3 py-1.5 text-left text-sm",
                  y === value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {formatters?.formatYearCaption?.(new Date(y, 0, 1), { locale }) ?? y}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <RDPDropdown {...props} />;
}

export type DatePickerFieldValue = Date | undefined;

export interface DatePickerFieldProps {
  value?: Date | string | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  /** Min date (e.g. prevent past dates) */
  fromDate?: Date;
  /** Max date */
  toDate?: Date;
  /** Allow clearing the selection */
  clearable?: boolean;
  /** DOB only: past dates (1900–today), compact scrollable month/year dropdowns */
  dateOfBirthMode?: boolean;
}

function parseDateValue(v: Date | string | null | undefined): Date | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return isValid(v) ? v : undefined;
  const d = new Date(v);
  return isValid(d) ? d : undefined;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  disabled = false,
  className,
  inputClassName,
  fromDate,
  toDate: toDateProp,
  clearable = false,
  dateOfBirthMode = false,
}: DatePickerFieldProps) {
  const effectiveFrom = dateOfBirthMode ? DOB_MIN_DATE : fromDate;
  const effectiveTo = dateOfBirthMode ? getDOBMaxDate() : toDateProp;

  const rawDate = parseDateValue(value ?? undefined);
  const date = React.useMemo(() => {
    if (rawDate == null) return undefined;
    if (!dateOfBirthMode) return rawDate;
    const max = getDOBMaxDate();
    if (rawDate > max) return max;
    if (rawDate < DOB_MIN_DATE) return DOB_MIN_DATE;
    return rawDate;
  }, [rawDate, dateOfBirthMode]);

  React.useEffect(() => {
    if (!dateOfBirthMode || date == null) return;
    const max = getDOBMaxDate();
    if (rawDate != null && (rawDate > max || rawDate < DOB_MIN_DATE)) {
      onChange?.(date);
    }
  }, [dateOfBirthMode, date, rawDate, onChange]);

  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const displayStr = date ? format(date, DISPLAY_FORMAT) : "";

  const handleSelect = React.useCallback(
    (d: Date | undefined) => {
      if (dateOfBirthMode && d != null) {
        const max = getDOBMaxDate();
        if (d > max) d = max;
        if (d < DOB_MIN_DATE) d = DOB_MIN_DATE;
      }
      onChange?.(d);
      if (d !== undefined) setOpen(false);
    },
    [dateOfBirthMode, onChange]
  );

  const handleOpen = React.useCallback(() => {
    if (!disabled) setOpen(true);
  }, [disabled]);

  React.useEffect(() => {
    if (!open) return;
    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDownOutside, true);
    document.addEventListener("touchstart", handlePointerDownOutside, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside, true);
      document.removeEventListener("touchstart", handlePointerDownOutside, true);
    };
  }, [open]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Choose date"
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
          }
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border border-input bg-background px-4 h-11 transition cursor-pointer",
          "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
          "hover:border-primary/50",
          disabled && "pointer-events-none opacity-50 cursor-not-allowed"
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          type="text"
          readOnly
          tabIndex={-1}
          value={displayStr}
          placeholder={placeholder}
          disabled={disabled}
          aria-hidden
          className={cn(
            "flex-1 min-w-0 bg-transparent border-0 p-0 text-sm text-foreground placeholder:text-muted-foreground cursor-pointer outline-none pointer-events-none",
            inputClassName
          )}
        />
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Calendar"
          className={cn(
            "absolute left-0 mt-2 z-[200] bg-popover rounded-xl shadow-xl border border-border p-3",
            "animate-in fade-in duration-200 animate-zoom-in-95",
            "w-full min-w-[260px] max-w-[min(100vw-2rem,300px)] max-h-[min(70vh,380px)] overflow-auto"
          )}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DayPicker
            mode="single"
            selected={date}
            onSelect={handleSelect}
            fromDate={effectiveFrom ?? DEFAULT_START}
            toDate={effectiveTo ?? DEFAULT_END}
            disabled={disabled}
            defaultMonth={date ?? (dateOfBirthMode ? getDOBMaxDate() : new Date())}
            captionLayout="dropdown-buttons"
            className={cn("rdp-date-picker p-0", dateOfBirthMode && "rdp-dob-picker")}
            components={dateOfBirthMode ? { Dropdown: DOBCompactDropdown } : undefined}
          />
        </div>
      )}
    </div>
  );
}
