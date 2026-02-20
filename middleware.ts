import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { getBetaConfig, isEmailAllowed } from "@/lib/beta/access";
import { REQUEST_ID_HEADER } from "@/lib/request-id";

const PUBLIC_BETA_PATHS = new Set(["/beta", "/login"]);

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const requestId = requestHeaders.get(REQUEST_ID_HEADER) || crypto.randomUUID();
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const pathname = req.nextUrl.pathname;
  const betaConfig = getBetaConfig();

  if (betaConfig.betaMode && !pathname.startsWith("/api") && !PUBLIC_BETA_PATHS.has(pathname)) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    const email = token?.email;

    if (!email) {
      const url = new URL("/beta", req.url);
      return NextResponse.redirect(url, {
        headers: {
          [REQUEST_ID_HEADER]: requestId,
        },
      });
    }

    if (!isEmailAllowed(email, betaConfig)) {
      const url = new URL("/beta?reason=not_allowed", req.url);
      return NextResponse.redirect(url, {
        headers: {
          [REQUEST_ID_HEADER]: requestId,
        },
      });
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; child-src 'self' blob:; img-src 'self' data: blob: https:; font-src 'self' data: https:; worker-src 'self' blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https:;",
  );
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/auth|api/health|api/ops/metrics|api/cron|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
