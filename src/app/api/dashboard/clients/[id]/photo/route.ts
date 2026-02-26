import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: { id, gymId: session.gymId },
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("photo");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    // In Node/Edge, formData file can be Blob or File
    const blob = file as Blob;
    if (!blob.size) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }
    const mime = (blob.type || "").toLowerCase();
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (mime && !allowedMimes.includes(mime)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, GIF, or WebP." },
        { status: 400 }
      );
    }
    if (blob.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum 5MB." },
        { status: 400 }
      );
    }

    const name = blob instanceof File ? blob.name : "photo";
    const ext = path.extname(name) || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext.toLowerCase()) ? ext : ".jpg";
    const filename = `${id}-${Date.now()}${safeExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "clients");
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    const bytes = await blob.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const profilePhoto = `/uploads/clients/${filename}`;
    await prisma.client.update({
      where: { id },
      data: { profilePhoto },
    });

    return NextResponse.json({ profilePhoto });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Profile photo upload error:", e);
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? message : "Upload failed. Please try a smaller image (under 1MB)." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.role !== "GYM_OWNER" || !session.gymId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: { id, gymId: session.gymId },
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const profilePhoto = client.profilePhoto;
    await prisma.client.update({
      where: { id },
      data: { profilePhoto: null },
    });

    if (profilePhoto && profilePhoto.startsWith("/uploads/clients/")) {
      const filepath = path.join(process.cwd(), "public", profilePhoto);
      try {
        await unlink(filepath);
      } catch {
        // ignore if file already missing
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Profile photo delete error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
