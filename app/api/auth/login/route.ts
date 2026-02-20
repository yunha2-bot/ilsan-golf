import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "golf_auth";

export async function POST(request: NextRequest) {
  const expected = process.env.GOLF_PASSWORD;
  if (!expected) {
    return NextResponse.json({ ok: true });
  }

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (password !== expected) {
    return NextResponse.json({ ok: false, error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: "/",
  });
  return res;
}
