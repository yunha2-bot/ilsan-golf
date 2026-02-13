import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "golf_auth";

export default function proxy(request: NextRequest) {
  const password = process.env.GOLF_PASSWORD;
  if (!password || password === "") {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;
  if (path === "/login" || path.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const auth = request.cookies.get(COOKIE_NAME)?.value;
  if (auth === "1") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", path);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
