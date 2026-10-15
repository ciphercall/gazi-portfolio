import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySession } from "@/lib/session";

/**
 * Gate for the admin surface.
 *
 * Two independent layers protect the panel — this middleware and a
 * `requireAdmin()` call inside every admin page. Middleware alone would leave
 * any route added later unguarded if its matcher were wrong, so the page-level
 * check is the real boundary and this is the cheap early reject.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isLoginEndpoint = pathname === "/api/admin/login";

  if (isLoginPage || isLoginEndpoint) {
    return NextResponse.next();
  }

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) {
    return NextResponse.next();
  }

  // API routes answer with a status; pages get redirected to the login screen
  // with a return path so the user lands where they intended.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "unauthorized", message: "Admin session required." },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  if (pathname !== "/admin") {
    loginUrl.searchParams.set("next", `${pathname}${search}`);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
