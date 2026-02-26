import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No logo file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, WebP or GIF." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Max 2MB." }, { status: 400 });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "jpg";
    const dir = path.join(process.cwd(), "public", "invoice-logos");
    await mkdir(dir, { recursive: true });
    const filename = `${session.gymId}.${ext}`;
    const filepath = path.join(dir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const logoUrl = `/invoice-logos/${filename}`;
    await prisma.gym.update({
      where: { id: session.gymId },
      data: { invoiceLogoUrl: logoUrl },
    });

    return NextResponse.json({ invoiceLogoUrl: logoUrl });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
