import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { isUploadUnderPublic, resolveAbsolutePath } from "@/lib/uploadConfig";

/**
 * UPLOAD_DIR이 public 밑이 아닐 때(예: NAS 볼륨) 업로드 파일을 서빙.
 * GET /api/uploads/2025/02/11/abc.jpg → 디스크에서 읽어 스트리밍
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  if (isUploadUnderPublic()) {
    return NextResponse.json({ error: "Not used when uploads are under public" }, { status: 404 });
  }

  const pathSegments = (await context.params).path;
  if (!pathSegments?.length) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }

  const relativePath = pathSegments.join("/");
  // 상위 디렉터리 접근 방지
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

  const stream = fs.createReadStream(absolutePath);
  return new NextResponse(stream, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
    },
  });
}
