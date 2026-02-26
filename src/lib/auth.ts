import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fitdesk-jwt-secret-min-32-characters-long"
);

export const COOKIE_NAME = "fitdesk_token";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export type JWTPayload = {
  sub: string;
  email: string;
  role: Role;
  gymId: string | null;
  iat?: number;
  exp?: number;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export async function createToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

/** Set cookie on a NextResponse (use in Route Handlers to avoid cookies() issues) */
export function setAuthCookieOnResponse(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<JWTPayload | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionOrThrow(): Promise<JWTPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export function isSuperAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN";
}

export function isGymOwner(role: Role): boolean {
  return role === "GYM_OWNER";
}
