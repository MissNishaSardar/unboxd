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
const AUTH = ["/auth"];

function withShell(request: NextRequest, shell: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-route-shell", shell);
  return NextResponse.next({
    request: new NextRequest(request.url, { headers: requestHeaders }),
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (AUTH.some((p) => pathname.startsWith(p))) {
    return withShell(request, "auth");
  }

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
    return withShell(request, "admin");
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
    "/cart",
    "/wishlist",
    "/admin",
    "/admin/:path*",
    "/auth/:path*",
  ],
};
