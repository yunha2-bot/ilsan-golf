import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { resolveAbsolutePath } from "@/lib/uploadConfig";

/**
 * 업로드 파일 서빙. GET /api/uploads/2025/02/11/abc.jpg → 디스크에서 읽어 반환
 * (로컬·서버 동일. standalone에서 런타임에 추가된 파일도 표시됨)
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const pathSegments = (await context.params).path;
  if (!pathSegments?.length) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }

  const relativePath = pathSegments.map((s) => decodeURIComponent(s)).join("/");
  if (relativePath.includes("..")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const absolutePath = resolveAbsolutePath(relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const mime: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  const contentType = mime[ext] || "application/octet-stream";

  const buffer = fs.readFileSync(absolutePath);
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.length),
      "Cache-Control": "public, max-age=31536000",
    },
  });
}
