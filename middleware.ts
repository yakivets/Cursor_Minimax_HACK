import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Authentication has been disabled; this middleware simply lets all
// requests through so the app can be used without logging in.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/book/:path*", "/speak/:path*"],
};

