import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportToXLSX, exportToCSV, reportFilename } from "@/lib/export-xlsx";

export async function GET(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("export");
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    if (format !== "xlsx" && format !== "csv") {
      return NextResponse.json({ error: "Add ?export=xlsx or ?export=csv" }, { status: 400 });
    }

    const start = startParam ? new Date(startParam) : undefined;
    const end = endParam ? new Date(endParam) : undefined;
    const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (start) where.createdAt = { ...where.createdAt, gte: start } as { gte: Date; lte?: Date };
    if (end) where.createdAt = { ...where.createdAt, lte: end } as { gte?: Date; lte: Date };
    const cleanWhere = Object.keys(where).length ? where : undefined;

    const gyms = await prisma.gym.findMany({
      where: cleanWhere,
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { clients: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const data = gyms.map((g, i) => ({
      "#": i + 1,
      Gym: g.name,
      Owner: g.owner.name,
      "Owner Email": g.owner.email,
      "Created At": g.createdAt.toISOString().slice(0, 10),
      "Client Count": g._count.clients,
      Active: g.isActive ? "Yes" : "No",
    }));

    const filename = reportFilename("admin_gyms", start, end, format);

    if (format === "csv") {
      const csv = exportToCSV(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const buf = exportToXLSX(data, "Gyms");
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
