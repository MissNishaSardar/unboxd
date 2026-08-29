import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED = [
  "/dashboard",
  "/checkout",
  "/orders",
  "/settings",
  "/cart",
  "/wishlist",
];
const ADMIN = ["/admin"];

function withShell(request: NextRequest, shell: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-route-shell", shell);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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
    if (
      session.user.role !== "admin" ||
      (session.user as unknown as { deletedAt?: unknown }).deletedAt ||
      (session.user as unknown as { banned?: unknown }).banned
    ) {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }
    return withShell(request, "admin");
  }

  if (!PROTECTED.some((p) => pathname.startsWith(p))) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
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
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/dashboard",
    "/checkout",
    "/orders/:path*",
    "/settings",
    "/settings/:path*",
    "/cart",
    "/wishlist",
    "/admin",
    "/admin/:path*",
  ],
};
