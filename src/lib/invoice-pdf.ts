import { jsPDF } from "jspdf";

// ============== Types ==============

export type InvoicePayment = {
  id: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail?: string | null;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
};

export type InvoiceGym = {
  name: string;
  invoiceLogoUrl: string | null;
  invoiceAddress?: string | null;
  invoicePhone?: string | null;
  invoiceEmail?: string | null;
  gstNumber?: string | null;
};

// ============== Layout constants (A4, print-ready) ==============

const PAGE = {
  width: 210,
  height: 297,
  margin: 20,
  marginBottom: 24,
};

const COLORS = {
  text: [30, 30, 30] as [number, number, number],
  textMuted: [100, 100, 100],
  primary: [88, 28, 135], // purple
  divider: [220, 220, 220],
  paidBg: [34, 197, 94],
  pendingBg: [234, 88, 12],
  tableHeaderBg: [248, 248, 250],
  totalBg: [245, 245, 250],
};

const FONT = {
  sizeTitle: 22,
  sizeSection: 11,
  sizeLabel: 9,
  sizeBody: 10,
  sizeSmall: 8,
};

// ============== Helpers ==============

export function formatInvoiceCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatInvoiceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatInvoiceMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function invoiceNumber(paymentId: string, paymentDate: string): string {
  const d = new Date(paymentDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const short = paymentId.slice(-6).toUpperCase();
  return `INV-${y}${m}-${short}`;
}

/** Load image from URL and return as data URL */
function imageUrlToDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        reject(new Error("Failed to get data URL"));
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url.startsWith("/") ? `${window.location.origin}${url}` : url;
  });
}

// ============== Document helpers ==============

function drawDivider(doc: jsPDF, y: number): number {
  doc.setDrawColor(...COLORS.divider);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
  return y + 12;
}

function drawSectionTitle(doc: jsPDF, x: number, y: number, title: string): number {
  doc.setFontSize(FONT.sizeSection);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(title, x, y);
  doc.setTextColor(...COLORS.text);
  return y + 8;
}

function drawLabelValue(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string,
  options?: { labelBold?: boolean }
): number {
  doc.setFontSize(FONT.sizeBody);
  doc.setFont("helvetica", options?.labelBold ? "bold" : "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(label, x, y);
  const labelW = doc.getTextWidth(label);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  doc.text(value, x + labelW + 2, y);
  return y + 6;
}

function drawBadge(
  doc: jsPDF,
  x: number,
  y: number,
  text: string,
  isPaid: boolean
): void {
  const padding = 2;
  doc.setFontSize(FONT.sizeSmall);
  doc.setFont("helvetica", "bold");
  const w = doc.getTextWidth(text) + padding * 4;
  const h = 6;
  doc.setFillColor(...(isPaid ? COLORS.paidBg : COLORS.pendingBg));
  doc.roundedRect(x, y - h + 1.5, w, h, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(text, x + padding * 2, y);
  doc.setTextColor(...COLORS.text);
}

// ============== Main generator ==============

export async function generateInvoicePdf(
  payment: InvoicePayment,
  gym: InvoiceGym,
  options?: { logoMaxWidth?: number; logoMaxHeight?: number }
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = PAGE.width;
  const margin = PAGE.margin;
  let y = margin;

  const logoMaxW = options?.logoMaxWidth ?? 36;
  const logoMaxH = options?.logoMaxHeight ?? 28;

  // ---------- Header: Logo (left) + Gym details (right) ----------
  if (gym.invoiceLogoUrl) {
    try {
      const dataUrl = await imageUrlToDataUrl(gym.invoiceLogoUrl);
      doc.addImage(dataUrl, "PNG", margin, y, logoMaxW, logoMaxH);
    } catch {
      // skip logo if load fails
    }
  }

  const headerLeft = margin + (gym.invoiceLogoUrl ? logoMaxW + 14 : 0);
  doc.setFontSize(FONT.sizeTitle);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text(gym.name, headerLeft, y + 10);

  let lineY = y + 10;
  doc.setFontSize(FONT.sizeBody);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  if (gym.invoiceAddress) {
    lineY += 6;
    doc.text(gym.invoiceAddress, headerLeft, lineY);
  }
  if (gym.invoicePhone) {
    lineY += 5;
    doc.text(gym.invoicePhone, headerLeft, lineY);
  }
  if (gym.invoiceEmail) {
    lineY += 5;
    doc.text(gym.invoiceEmail, headerLeft, lineY);
  }
  if (gym.gstNumber) {
    lineY += 5;
    doc.text(`GST: ${gym.gstNumber}`, headerLeft, lineY);
  }

  y += gym.invoiceLogoUrl ? Math.max(logoMaxH, lineY - y + 4) : lineY - y + 6;
  y = drawDivider(doc, y);

  // ---------- Invoice meta: Two columns (aligned) ----------
  const col1X = margin;
  const col2X = pageW / 2;
  const metaStartY = y;

  y = drawSectionTitle(doc, col1X, y, "Bill To");
  doc.setFontSize(FONT.sizeBody);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text(payment.clientName, col1X, y);
  let leftColY = y + 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  if (payment.clientPhone) {
    doc.text(payment.clientPhone, col1X, leftColY);
    leftColY += 5;
  }
  if (payment.clientEmail) {
    doc.text(payment.clientEmail, col1X, leftColY);
    leftColY += 5;
  }
  leftColY += 4;

  y = drawSectionTitle(doc, col2X, metaStartY, "Invoice Details");
  const invNum = invoiceNumber(payment.id, payment.paymentDate);
  y = drawLabelValue(doc, col2X, y + 2, "Invoice No. ", invNum, { labelBold: true });
  y = drawLabelValue(doc, col2X, y, "Receipt ID ", payment.id.slice(-8).toUpperCase());
  y = drawLabelValue(doc, col2X, y, "Date ", formatInvoiceDate(payment.paymentDate));
  y = drawLabelValue(doc, col2X, y, "Due Date ", "N/A");
  drawBadge(doc, col2X, y + 4, "PAID", true);
  const rightColY = y + 12;
  y = Math.max(leftColY, rightColY);

  // ---------- Payment details table ----------
  y = drawSectionTitle(doc, margin, y, "Payment Details");
  y += 4;

  const tableTop = y;
  const colDescW = 90;
  const colDurW = 40;
  const colAmtW = pageW - margin * 2 - colDescW - colDurW;
  const rowH = 9;

  // Table header
  doc.setFillColor(...COLORS.tableHeaderBg);
  doc.rect(margin, y, colDescW + colDurW + colAmtW, rowH, "F");
  doc.setFontSize(FONT.sizeLabel);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Description", margin + 4, y + 5.5);
  doc.text("Duration", margin + colDescW + 4, y + 5.5);
  doc.text("Amount", pageW - margin - 4, y + 5.5, { align: "right" });
  y += rowH;

  doc.setDrawColor(...COLORS.divider);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageW - margin, y);

  // Table row: single payment as one line item
  const description = "Gym Membership Payment";
  const duration = formatInvoiceMonth(payment.paymentDate);
  const amountStr = formatInvoiceCurrency(payment.amount);
  y += rowH * 0.6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT.sizeBody);
  doc.setTextColor(...COLORS.text);
  doc.text(description, margin + 4, y);
  doc.text(duration, margin + colDescW + 4, y);
  doc.text(amountStr, pageW - margin - 4, y, { align: "right" });
  y += rowH + 4;

  // Subtotal / Total block
  const blockX = pageW - margin - 55;
  doc.setFontSize(FONT.sizeBody);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Subtotal", blockX, y);
  doc.text(formatInvoiceCurrency(payment.amount), pageW - margin - 4, y, { align: "right" });
  y += 6;
  doc.text("Discount", blockX, y);
  doc.text("—", pageW - margin - 4, y, { align: "right" });
  y += 6;
  doc.text("Tax", blockX, y);
  doc.text("—", pageW - margin - 4, y, { align: "right" });
  y += 10;

  doc.setFillColor(...COLORS.totalBg);
  doc.rect(blockX - 4, y - 6, 59, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.sizeSection);
  doc.setTextColor(...COLORS.text);
  doc.text("Total", blockX, y + 2);
  doc.text(formatInvoiceCurrency(payment.amount), pageW - margin - 4, y + 2, { align: "right" });
  y += 18;

  // ---------- Payment information ----------
  y = drawSectionTitle(doc, margin, y, "Payment Information");
  y += 2;
  doc.setFontSize(FONT.sizeBody);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Payment Method", margin, y);
  doc.setTextColor(...COLORS.text);
  doc.text(payment.paymentMethod || "—", margin + 38, y);
  y += 6;
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Transaction ID", margin, y);
  doc.setTextColor(...COLORS.text);
  doc.text("—", margin + 38, y);
  y += 6;
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Paid On", margin, y);
  doc.setTextColor(...COLORS.text);
  doc.text(formatInvoiceDate(payment.paymentDate), margin + 38, y);
  y += 8;
  drawBadge(doc, margin, y, "PAID", true);
  y += 14;

  // ---------- Footer ----------
  y = drawDivider(doc, y);

  doc.setFontSize(FONT.sizeBody);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  doc.text("Thank you for your payment.", pageW / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(FONT.sizeSmall);
  doc.setTextColor(...COLORS.textMuted);
  const footerLines = [
    "Terms & Conditions apply as per gym policy. Please retain this receipt for your records.",
    `Support: ${gym.invoiceEmail || gym.invoicePhone || "—"}`,
    "This is a computer-generated invoice and does not require a signature.",
  ];
  footerLines.forEach((line) => {
    doc.text(line, pageW / 2, y, { align: "center" });
    y += 5;
  });

  // Page number
  y = PAGE.height - PAGE.marginBottom;
  doc.setFontSize(FONT.sizeSmall);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Page 1 of 1", pageW / 2, y, { align: "center" });

  doc.save(`invoice-${payment.id.slice(-8)}-${payment.clientName.replace(/\s+/g, "-")}.pdf`);
}
