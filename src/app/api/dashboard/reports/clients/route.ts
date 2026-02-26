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

    const where: { gymId: string; joinDate?: { gte?: Date; lte?: Date } } = {
      gymId: session.gymId,
    };
    if (start || end) {
      where.joinDate = {};
      if (start) where.joinDate.gte = start;
      if (end) where.joinDate.lte = end;
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const forExport = clients.map((c) => ({
      Name: c.fullName,
      Phone: c.phone || "",
      Email: c.email || "",
      "Join Date": c.joinDate.toISOString().slice(0, 10),
      "Subscription End": c.subscriptionEndDate?.toISOString().slice(0, 10) || "",
      Status: c.subscriptionStatus,
      "Total Amount": Number(c.totalAmount),
      "Amount Paid": Number(c.amountPaid),
    }));

    if (exportType === "csv") {
      const csv = exportToCSV(forExport);
      const filename = reportFilename("clients", start, end, "csv");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
    if (exportType === "xlsx") {
      const buf = exportToXLSX(forExport, "Clients");
      const filename = reportFilename("clients", start, end);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      preview: forExport.slice(0, 100),
      total: clients.length,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
