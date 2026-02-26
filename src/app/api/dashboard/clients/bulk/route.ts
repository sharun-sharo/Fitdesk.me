import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

/** Parse date from CSV (Excel-style MM/dd/yy, ISO yyyy-MM-dd, or Excel serial). */
function parseDate(value: string | null | undefined): Date | null {
  const s = value?.trim();
  if (!s) return null;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  const parts = s.split(/[/-]/);
  if (parts.length === 3) {
    const n1 = parseInt(parts[0], 10);
    const n2 = parseInt(parts[1], 10);
    const n3 = parseInt(parts[2], 10);
    if (Number.isNaN(n1) || Number.isNaN(n2) || Number.isNaN(n3)) return null;
    let year: number;
    let month: number;
    let day: number;
    if (n1 >= 1000) {
      year = n1;
      month = n2 - 1;
      day = n3;
    } else if (n1 >= 1 && n1 <= 12 && n2 >= 1 && n2 <= 31) {
      month = n1 - 1;
      day = n2;
      year = n3;
    } else if (n2 >= 1 && n2 <= 12 && n1 >= 1 && n1 <= 31) {
      day = n1;
      month = n2 - 1;
      year = n3;
    } else {
      return null;
    }
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const parsed = new Date(year, month, day);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const serial = parseInt(s, 10);
  if (!Number.isNaN(serial) && serial > 0) {
    const excelEpoch = new Date(1899, 11, 30);
    const parsed = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

type ClientInput = {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  subscriptionStatus?: string;
  totalAmount?: number;
  amountPaid?: number;
};

export async function POST(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const rows = Array.isArray(body.rows) ? body.rows as ClientInput[] : [];
    if (rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }
    if (rows.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 clients per upload" },
        { status: 400 }
      );
    }

    const results: { created: number; failed: number; errors: string[] } = {
      created: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fullName = row.fullName?.trim();
      if (!fullName) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Full name is required`);
        continue;
      }

      try {
        await prisma.client.create({
          data: {
            gymId: session.gymId,
            fullName,
            phone: row.phone?.trim() || null,
            email: row.email?.trim() || null,
            address: row.address?.trim() || null,
            dateOfBirth: parseDate(row.dateOfBirth ?? null) ?? null,
            subscriptionStartDate: parseDate(row.subscriptionStartDate ?? null) ?? null,
            subscriptionEndDate: parseDate(row.subscriptionEndDate ?? null) ?? null,
            subscriptionStatus:
              row.subscriptionStatus === "EXPIRED" ||
              row.subscriptionStatus === "CANCELLED"
                ? row.subscriptionStatus
                : "ACTIVE",
            totalAmount: new Decimal(Number(row.totalAmount) || 0),
            amountPaid: new Decimal(Number(row.amountPaid) || 0),
          },
        });
        results.created++;
      } catch (e) {
        results.failed++;
        results.errors.push(
          `Row ${i + 1} (${fullName}): ${e instanceof Error ? e.message : "Failed"}`
        );
      }
    }

    return NextResponse.json(results);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
