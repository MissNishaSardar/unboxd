import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED = ["/myprofile", "/checkout", "/orders", "/cart", "/wishlist"];
const ADMIN = ["/admin"];

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return (
    request.headers.get("x-real-ip") ??
    (request as unknown as { ip?: string }).ip ??
    null
  );
}

function withShell(request: NextRequest, shell: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-route-shell", shell);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const ip = getClientIp(request);
  if (ip) requestHeaders.set("x-forwarded-for", ip);
  const ua = request.headers.get("user-agent");
  if (ua) requestHeaders.set("user-agent", ua);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function isPrivilegedBlocked(user: unknown): boolean {
  const record = user as { deletedAt?: unknown; banned?: unknown } | null;
  return Boolean(record?.deletedAt) || Boolean(record?.banned);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ADMIN.some((p) => pathname.startsWith(p))) {
    const session = await auth.api.getSession({
      headers: request.headers as unknown as Headers,
    });
    if (!session) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.user.role !== "admin" || isPrivilegedBlocked(session.user)) {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }
    return withShell(request, "admin");
  }

  if (!PROTECTED.some((p) => pathname.startsWith(p))) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    const ip = getClientIp(request);
    if (ip) requestHeaders.set("x-forwarded-for", ip);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const ip = getClientIp(request);
  if (ip) requestHeaders.set("x-forwarded-for", ip);
  const ua = request.headers.get("user-agent");
  if (ua) requestHeaders.set("user-agent", ua);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/myprofile",
    "/myprofile/:path*",
    "/checkout",
    "/orders/:path*",
    "/cart",
    "/wishlist",
    "/admin",
    "/admin/:path*",
  ],
};
