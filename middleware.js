import { NextResponse } from "next/server";

const publicPaths = ["/login", "/api/health", "/api/auth/session"];

function cronAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    request.headers.get("x-cron-secret");
  return header === secret;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/worker/") && request.headers.get("x-worker-secret")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/cron/") && cronAuthorized(request)) {
    return NextResponse.next();
  }

  const session = request.cookies.get("session")?.value;
  const devBypass =
    process.env.DEV_BYPASS_AUTH === "true" && process.env.NODE_ENV === "development";

  if (!session && !devBypass && !pathname.startsWith("/login")) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
