"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { format as formatDateFns } from "date-fns";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ReportsAdminSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const { toast } = useToast();

  async function exportReport(
    type: "subscriptions" | "gyms",
    format: "xlsx" | "csv"
  ) {
    const key = `${type}-${format}`;
    setLoading(key);
    try {
      const params = new URLSearchParams({ export: format });
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      const res = await fetch(`/api/admin/reports/${type}?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
        `${type}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export downloaded", variant: "success" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Date range (optional)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Leave empty for all data
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="grid gap-2">
            <Label>Start</Label>
            <DatePickerField
              value={start || undefined}
              onChange={(d) => setStart(d ? formatDateFns(d, "yyyy-MM-dd") : "")}
              placeholder="mm/dd/yyyy"
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label>End</Label>
            <DatePickerField
              value={end || undefined}
              onChange={(d) => setEnd(d ? formatDateFns(d, "yyyy-MM-dd") : "")}
              placeholder="mm/dd/yyyy"
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-xl border-border/50 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Subscription Revenue</CardTitle>
            <p className="text-sm text-muted-foreground">
              Export gym subscriptions and revenue
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              onClick={() => exportReport("subscriptions", "xlsx")}
              disabled={!!loading}
              className="rounded-xl"
            >
              {loading === "subscriptions-xlsx" ? (
                <span className="animate-pulse">Exporting...</span>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  XLSX
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => exportReport("subscriptions", "csv")}
              disabled={!!loading}
              className="rounded-xl"
            >
              <FileText className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/50 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Gym Owners</CardTitle>
            <p className="text-sm text-muted-foreground">
              Export gym owner list and growth
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              onClick={() => exportReport("gyms", "xlsx")}
              disabled={!!loading}
              className="rounded-xl"
            >
              {loading === "gyms-xlsx" ? (
                <span className="animate-pulse">Exporting...</span>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  XLSX
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => exportReport("gyms", "csv")}
              disabled={!!loading}
              className="rounded-xl"
            >
              <FileText className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
