import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, setAuthCookieOnResponse } from "@/lib/auth";

// Ensure Node runtime so Prisma and bcrypt work; always return JSON
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body", 400);
    }
    const email = typeof body === "object" && body !== null && "email" in body ? (body as { email: unknown }).email : undefined;
    const password = typeof body === "object" && body !== null && "password" in body ? (body as { password: unknown }).password : undefined;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return jsonError("Email and password are required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { gym: true },
    });

    if (!user) {
      return jsonError("Invalid email or password", 401);
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return jsonError("Invalid email or password", 401);
    }

    const token = await createToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      gymId: user.gymId,
    });

    const redirect = user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";
    const response = NextResponse.json({ redirect });
    setAuthCookieOnResponse(response, token);
    return response;
  } catch (e) {
    console.error("Login error:", e);

    const isPrisma = e && typeof e === "object" && "code" in e;
    const code = isPrisma ? (e as { code?: string }).code : undefined;

    let message = "Something went wrong";
    if (code === "P1001" || code === "P1002" || code === "P1017") {
      message = "Database connection failed. Check DATABASE_URL and ensure the database is running.";
    } else if (code === "P2021" || code === "P2010") {
      message = "Database not set up. Run: npx prisma db push && npm run db:seed";
    } else if (process.env.NODE_ENV === "development" && e instanceof Error) {
      message = e.message;
    }

    return jsonError(message, 500);
  }
}
