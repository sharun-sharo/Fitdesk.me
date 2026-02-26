import * as XLSX from "xlsx";

/**
 * Export an array of objects to XLSX and return the buffer.
 */
export function exportToXLSX<T extends Record<string, unknown>>(
  data: T[],
  sheetName = "Sheet1"
): Buffer {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buf as Buffer;
}

/**
 * Build filename with date range.
 */
export function reportFilename(prefix: string, start?: Date, end?: Date, ext = "xlsx"): string {
  const a = start ? start.toISOString().slice(0, 10) : "";
  const b = end ? end.toISOString().slice(0, 10) : "";
  const range = a && b ? `${a}_to_${b}` : new Date().toISOString().slice(0, 10);
  return `${prefix}_${range}.${ext}`;
}

/**
 * Export array of objects to CSV string.
 */
export function exportToCSV<T extends Record<string, unknown>>(data: T[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [headers.join(","), ...data.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return rows.join("\n");
}
