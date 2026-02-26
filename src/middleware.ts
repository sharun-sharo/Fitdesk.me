import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fitdesk-jwt-secret-min-32-characters-long"
);

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/health"];
const SUPER_ADMIN_PREFIX = "/admin";
const GYM_OWNER_PREFIX = "/dashboard";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/api/auth/"))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("fitdesk_token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    const gymId = payload.gymId as string | null;

    // Super Admin routes
    if (pathname.startsWith(SUPER_ADMIN_PREFIX)) {
      if (role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.next();
    }

    // Root redirect by role
    if (pathname === "/") {
      if (role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Gym Owner routes (dashboard, etc.)
    if (pathname.startsWith(GYM_OWNER_PREFIX)) {
      if (role !== "GYM_OWNER") {
        if (role === "SUPER_ADMIN") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        const res = NextResponse.redirect(new URL("/login", request.url));
        res.cookies.delete("fitdesk_token");
        return res;
      }
      // Require gymId for dashboard access to avoid redirect loop (dashboard redirects to login if no gymId)
      if (!gymId || gymId === "") {
        const res = NextResponse.redirect(new URL("/login", request.url));
        res.cookies.delete("fitdesk_token");
        return res;
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.delete("fitdesk_token");
      return res;
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("fitdesk_token");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/logout).*)",
  ],
};
