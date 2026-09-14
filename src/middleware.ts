import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  // ── Public routes (no auth required) ──────────────────────────────────
  const publicPaths = ["/", "/login", "/register", "/forgot-password", "/menu"];
  const isPublic =
    publicPaths.some((p) => pathname === p || pathname.startsWith("/menu/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/images") ||
    pathname.includes(".");

  if (isPublic) return NextResponse.next();

  // ── Not authenticated ──────────────────────────────────────────────────
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Role-based access control ──────────────────────────────────────────
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(getDashboardForRole(role), req.url));
  }

  if (pathname.startsWith("/staff") && role !== "STAFF" && role !== "ADMIN") {
    return NextResponse.redirect(new URL(getDashboardForRole(role), req.url));
  }

  if (pathname.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(new URL(getDashboardForRole(role), req.url));
  }

  return NextResponse.next();
});

function getDashboardForRole(role: string | undefined): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "STAFF":
      return "/staff";
    case "STUDENT":
      return "/student";
    default:
      return "/login";
  }
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|images|public).*)",
  ],
};
