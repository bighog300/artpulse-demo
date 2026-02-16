import { NextResponse, type NextRequest } from "next/server";
import { REQUEST_ID_HEADER } from "@/lib/request-id";

export function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const requestId = requestHeaders.get(REQUEST_ID_HEADER) || crypto.randomUUID();
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
