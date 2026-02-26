import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function isExpiringWithinDays(endDate: Date | string, days: number): boolean {
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  const daysDiff = diff / (1000 * 60 * 60 * 24);
  return daysDiff >= 0 && daysDiff <= days;
}

/** Days from now to endDate (positive = future, negative = past). */
export function daysUntil(endDate: Date | string): number {
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const now = new Date();
  return Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

/** Debounce with cancel so a pending call can be cancelled (e.g. when search is cleared). */
export function debounceWithCancel<T extends (...args: any[]) => void>(
  fn: T,
  ms: number
): { run: (...args: Parameters<T>) => void; cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout>;
  return {
    run: (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), ms);
    },
    cancel: () => clearTimeout(timeout),
  };
}
