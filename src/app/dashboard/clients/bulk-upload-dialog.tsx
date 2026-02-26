"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, AlertCircle, Download } from "lucide-react";

const SAMPLE_CSV = `Full Name,Phone,Email,Address,Date of Birth,Subscription Start Date,Subscription Expiry Date,Status,Total Amount,Amount Paid
John Doe,+91 98765 43210,john@example.com,123 Main St,1990-05-15,2025-01-01,2025-12-31,ACTIVE,2499,2499
Jane Smith,+91 91234 56789,jane@example.com,456 Park Ave,,2025-02-01,2026-01-31,ACTIVE,2999,1500`;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

const COLUMN_MAP: Record<string, string> = {
  fullname: "fullName",
  "full name": "fullName",
  name: "fullName",
  phone: "phone",
  email: "email",
  address: "address",
  dateofbirth: "dateOfBirth",
  "date of birth": "dateOfBirth",
  dob: "dateOfBirth",
  subscriptionstartdate: "subscriptionStartDate",
  "subscription start": "subscriptionStartDate",
  "subscription start date": "subscriptionStartDate",
  startdate: "subscriptionStartDate",
  subscriptionenddate: "subscriptionEndDate",
  "subscription end": "subscriptionEndDate",
  "subscription expiry date": "subscriptionEndDate",
  subscriptionexpirydate: "subscriptionEndDate",
  enddate: "subscriptionEndDate",
  expirydate: "subscriptionEndDate",
  status: "subscriptionStatus",
  subscriptionstatus: "subscriptionStatus",
  totalamount: "totalAmount",
  "total amount": "totalAmount",
  amount: "totalAmount",
  amountpaid: "amountPaid",
  "amount paid": "amountPaid",
  paid: "amountPaid",
};

function parseCSV(text: string): { rows: Record<string, string>[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must have a header row and at least one data row."] };
  }
  const headerLine = parseCSVLine(lines[0]);
  const headerKeys = headerLine.map((h) => {
    const normalized = h.toLowerCase().replace(/\s+/g, " ").trim();
    return COLUMN_MAP[normalized] ?? null;
  });
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headerKeys.forEach((key, idx) => {
      if (key && values[idx] !== undefined) row[key] = values[idx] ?? "";
    });
    if (row.fullName?.trim()) rows.push(row);
    else if (lines[i].trim()) errors.push(`Row ${i + 1}: missing full name`);
  }
  return { rows, errors };
}

type BulkUploadDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
};

export function BulkUploadDialog({ open, onOpenChange, onSuccess }: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{ rows: Record<string, string>[]; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      setResult(null);
      if (!f) {
        setFile(null);
        setParsed(null);
        return;
      }
      if (!f.name.toLowerCase().endsWith(".csv")) {
        toast({ title: "Please choose a CSV file", variant: "destructive" });
        setFile(null);
        setParsed(null);
        return;
      }
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        const out = parseCSV(text);
        setParsed(out);
        if (out.rows.length > 500) {
          toast({ title: "Maximum 500 rows per upload. Only first 500 will be used.", variant: "destructive" });
        }
      };
      reader.readAsText(f, "UTF-8");
    },
    [toast]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed?.rows.length) {
      toast({ title: "No valid rows to upload", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const rows = parsed.rows.slice(0, 500).map((r) => ({
        fullName: r.fullName?.trim() || "",
        phone: r.phone?.trim() || null,
        email: r.email?.trim() || null,
        address: r.address?.trim() || null,
        dateOfBirth: r.dateOfBirth?.trim() || null,
        subscriptionStartDate: r.subscriptionStartDate?.trim() || null,
        subscriptionEndDate: r.subscriptionEndDate?.trim() || null,
        subscriptionStatus: r.subscriptionStatus?.trim() || undefined,
        totalAmount: r.totalAmount ? Number(r.totalAmount) : 0,
        amountPaid: r.amountPaid ? Number(r.amountPaid) : 0,
      }));
      const res = await fetch("/api/dashboard/clients/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Upload failed", variant: "destructive" });
        return;
      }
      setResult(data);
      if (data.created > 0) {
        toast({ title: `${data.created} client(s) added`, variant: "success" });
        window.dispatchEvent(new Event("clients-refresh"));
        onSuccess();
      }
      if (data.failed > 0 && data.created === 0) {
        toast({ title: "No clients added. Check errors below.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setFile(null);
      setParsed(null);
      setResult(null);
    }
    onOpenChange(open);
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fitdesk-clients-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const rowCount = parsed?.rows.length ?? 0;
  const canSubmit = rowCount > 0 && rowCount <= 500;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk upload clients
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Upload a CSV with columns: <strong>Full Name</strong> (required), Phone, Email, Address, Date of Birth,
          <strong>Subscription Start Date</strong>, <strong>Subscription Expiry Date</strong> (or End Date), Status (ACTIVE/EXPIRED/CANCELLED), Total Amount, Amount Paid.
          Include both start and expiry date columns so subscription details show correctly. First row should be the header.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl gap-2 w-fit"
          onClick={downloadSample}
        >
          <Download className="h-4 w-4" />
          Download sample CSV
        </Button>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>CSV file</Label>
            <div className="flex items-center gap-2 border border-dashed rounded-xl p-4 bg-muted/30">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
              />
              {file && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileSpreadsheet className="h-4 w-4" />
                  {file.name}
                </span>
              )}
            </div>
          </div>
          {parsed && (
            <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
              <p className="text-sm font-medium">
                {rowCount} row(s) to import
                {rowCount > 500 && " (max 500 will be sent)"}
              </p>
              {parsed.errors.length > 0 && (
                <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <ul className="list-disc list-inside">
                    {parsed.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {parsed.errors.length > 5 && (
                      <li>… and {parsed.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          {result && (
            <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
              <p className="text-sm font-medium">
                Created: {result.created} · Failed: {result.failed}
              </p>
              {result.errors.length > 0 && (
                <ul className="text-sm text-muted-foreground list-disc list-inside max-h-24 overflow-y-auto">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li>… and {result.errors.length - 10} more</li>
                  )}
                </ul>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || loading}
              className="rounded-xl gap-2"
            >
              {loading ? "Uploading…" : `Upload ${rowCount} client(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
