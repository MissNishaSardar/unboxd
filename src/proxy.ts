import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED = [
  "/dashboard",
  "/checkout",
  "/orders",
  "/settings",
  "/profile",
  "/cart",
];
const ADMIN = ["/admin"];

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
    if (session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }
    return NextResponse.next();
  }

  if (!PROTECTED.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/checkout",
    "/orders/:path*",
    "/settings",
    "/profile",
    "/cart",
    "/admin",
    "/admin/:path*",
  ],
};
