import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportToXLSX, exportToCSV, reportFilename } from "@/lib/export-xlsx";

export async function GET(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const exportType = searchParams.get("export"); // "xlsx" | "csv"

    const start = startParam ? new Date(startParam) : undefined;
    const end = endParam ? new Date(endParam) : undefined;

    const where: { client: { gymId: string }; paymentDate?: { gte?: Date; lte?: Date } } = {
      client: { gymId: session.gymId },
    };
    if (start || end) {
      where.paymentDate = {};
      if (start) where.paymentDate.gte = start;
      if (end) where.paymentDate.lte = end;
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "asc" },
      include: { client: { select: { fullName: true } } },
    });

    const preview = payments.map((p) => ({
      Date: p.paymentDate.toISOString().slice(0, 10),
      Amount: Number(p.amount),
      "Payment Method": p.paymentMethod || "",
      Client: p.client.fullName,
    }));

    const forExport = preview.map(({ Date: d, Amount, "Payment Method": m }) => ({
      Date: d,
      Amount,
      "Payment Method": m,
    }));

    if (exportType === "csv") {
      const csv = exportToCSV(forExport);
      const filename = reportFilename("revenue", start, end, "csv");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
    if (exportType === "xlsx") {
      const buf = exportToXLSX(forExport, "Revenue");
      const filename = reportFilename("revenue", start, end);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      preview: forExport.slice(0, 100),
      total: payments.length,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
