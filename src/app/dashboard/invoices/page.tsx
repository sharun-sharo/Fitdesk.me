"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  FileText,
  Download,
  Upload,
  ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateInvoicePdf } from "@/lib/invoice-pdf";

type GymInfo = {
  name: string;
  invoiceLogoUrl: string | null;
  invoiceAddress?: string | null;
  invoicePhone?: string | null;
  invoiceEmail?: string | null;
  gstNumber?: string | null;
};
type PaymentRow = {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
};

export default function InvoicesPage() {
  const [gym, setGym] = useState<GymInfo | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [invoicePhone, setInvoicePhone] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const { toast } = useToast();

  const fetchGym = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/gym");
      if (!res.ok) throw new Error("Failed to load gym");
      const data = await res.json();
      setGym({
        name: data.name ?? "",
        invoiceLogoUrl: data.invoiceLogoUrl ?? null,
        invoiceAddress: data.invoiceAddress ?? null,
        invoicePhone: data.invoicePhone ?? null,
        invoiceEmail: data.invoiceEmail ?? null,
        gstNumber: data.gstNumber ?? null,
      });
      if (data.invoiceLogoUrl) setLogoPreview(data.invoiceLogoUrl);
      setInvoiceAddress(data.invoiceAddress ?? "");
      setInvoicePhone(data.invoicePhone ?? "");
      setInvoiceEmail(data.invoiceEmail ?? "");
      setGstNumber(data.gstNumber ?? "");
    } catch {
      toast({ title: "Error", description: "Could not load gym details", variant: "destructive" });
    }
  }, [toast]);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/payments");
      if (!res.ok) throw new Error("Failed to load payments");
      const data = await res.json();
      setPayments(data.payments ?? []);
    } catch {
      toast({ title: "Error", description: "Could not load payments", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchGym(), fetchPayments()]);
      setLoading(false);
    })();
  }, [fetchGym, fetchPayments]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image (JPEG, PNG, WebP, GIF)", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("logo", logoFile);
      const res = await fetch("/api/dashboard/invoice/logo", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setGym((g) => (g ? { ...g, invoiceLogoUrl: data.invoiceLogoUrl } : null));
      setLogoPreview(data.invoiceLogoUrl);
      setLogoFile(null);
      toast({ title: "Logo updated", description: "It will appear on your invoices." });
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveInvoiceDetails = async () => {
    setSavingDetails(true);
    try {
      const res = await fetch("/api/dashboard/gym", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceAddress: invoiceAddress.trim() || null,
          invoicePhone: invoicePhone.trim() || null,
          invoiceEmail: invoiceEmail.trim() || null,
          gstNumber: gstNumber.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setGym((g) =>
        g
          ? {
              ...g,
              invoiceAddress: data.invoiceAddress ?? null,
              invoicePhone: data.invoicePhone ?? null,
              invoiceEmail: data.invoiceEmail ?? null,
              gstNumber: data.gstNumber ?? null,
            }
          : null
      );
      toast({ title: "Saved", description: "Business details updated for invoices." });
    } catch {
      toast({ title: "Error", description: "Could not save details", variant: "destructive" });
    } finally {
      setSavingDetails(false);
    }
  };

  const handleDownloadPdf = async (p: PaymentRow) => {
    if (!gym) return;
    setDownloadingId(p.id);
    try {
      await generateInvoicePdf(
        {
          id: p.id,
          clientName: p.clientName,
          clientPhone: p.clientPhone,
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
        },
        gym
      );
      toast({ title: "Download started", description: "Invoice PDF saved." });
    } catch (e) {
      toast({ title: "Download failed", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Invoice</span>
      </nav>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoice</h1>
        <p className="text-muted-foreground mt-1">
          Download payment receipts as PDF. Add a logo to show on all invoices.
        </p>
      </div>

      {/* Logo + Business details side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <Card className="rounded-xl border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Invoice logo
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              This logo appears on downloaded PDF invoices. JPEG, PNG, WebP or GIF, max 2MB.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-24 w-48 rounded-lg" />
            ) : (
              <>
                <div className="flex items-center gap-4 flex-wrap">
                  {logoPreview && (
                    <div className="h-16 w-32 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <span className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-accent">
                        <Upload className="h-4 w-4" />
                        {logoPreview && !logoFile ? "Change logo" : "Choose image"}
                      </span>
                    </Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={handleLogoSelect}
                    />
                    {logoFile && (
                      <Button
                        onClick={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="rounded-lg"
                      >
                        {uploadingLogo ? "Uploading..." : "Save logo"}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">Business details on invoice</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Address, phone, email and GST appear in the header of downloaded PDFs.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Address</Label>
              <Input
                placeholder="Gym address"
                value={invoiceAddress}
                onChange={(e) => setInvoiceAddress(e.target.value)}
                className="rounded-lg mt-1"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <Input
                  placeholder="Phone"
                  value={invoicePhone}
                  onChange={(e) => setInvoicePhone(e.target.value)}
                  className="rounded-lg mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  placeholder="Email"
                  value={invoiceEmail}
                  onChange={(e) => setInvoiceEmail(e.target.value)}
                  className="rounded-lg mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">GST number (optional)</Label>
              <Input
                placeholder="GSTIN"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="rounded-lg mt-1"
              />
            </div>
            <Button onClick={handleSaveInvoiceDetails} disabled={savingDetails} className="rounded-lg mt-2">
              {savingDetails ? "Saving..." : "Save details"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payments list → invoices */}
      <Card className="rounded-xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payment receipts
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Each payment can be downloaded as a PDF invoice. New payments appear here after you record them.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No payments yet</p>
              <p className="text-sm mt-1">Record a payment from the Payments page to generate invoices here.</p>
              <Button asChild variant="outline" className="mt-4 rounded-xl">
                <Link href="/dashboard/payments">Go to Payments</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-medium">Client</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Method</th>
                    <th className="text-right p-3 font-medium w-32">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-3 font-medium">{p.clientName}</td>
                      <td className="p-3 text-muted-foreground">{formatDate(p.paymentDate)}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                      <td className="p-3 text-muted-foreground">{p.paymentMethod ?? "—"}</td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg gap-1.5"
                          disabled={downloadingId === p.id}
                          onClick={() => handleDownloadPdf(p)}
                        >
                          <Download className="h-4 w-4" />
                          {downloadingId === p.id ? "..." : "PDF"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
