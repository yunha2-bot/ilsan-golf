import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { prisma } from "@/lib/prisma";
import {
  getUploadDirForDate,
  getRelativePath,
  ensureUploadDirs,
  getFileUrl,
} from "@/lib/uploadConfig";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
];
const MAX_SIZE_IMAGE = 10 * 1024 * 1024; // 10MB
const MAX_SIZE_VIDEO = 50 * 1024 * 1024; // 50MB

function safeFilename(original: string): string {
  const ext = path.extname(original) || ".jpg";
  const base = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return base + ext.toLowerCase();
}

function getBaseUrlFromRequest(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env?.trim()) return env.replace(/\/$/, "").trim();
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto");
  if (host) {
    const scheme = proto === "https" || proto === "on" ? "https" : "http";
    return `${scheme}://${host}`;
  }
  try {
    const url = new URL(req.url);
    return url.origin;
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const baseUrl = getBaseUrlFromRequest(req);
    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim() || "제목 없음";
    const description = (formData.get("description") as string)?.trim() || null;
    const tagsRaw = (formData.get("tags") as string)?.trim() || "";
    const tags = tagsRaw
      ? tagsRaw
          .split(/[,，\s]+/)
          .map((t) => t.trim())
          .filter(Boolean)
          .join(",")
      : "";
    const groupId = (formData.get("groupId") as string)?.trim() || null;
    const isCover = formData.get("isCover") === "true";
    const roundIdRaw = (formData.get("roundId") as string)?.trim();
    const roundId = roundIdRaw ? parseInt(roundIdRaw, 10) || null : null;
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "이미지 또는 동영상 파일이 필요합니다." },
        { status: 400 },
      );
    }

    const type = file.type;
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "지원 형식: 이미지(JPEG, PNG, GIF, WebP), 동영상(MP4, WebM, MOV)" },
        { status: 400 },
      );
    }

    const isVideo = type.startsWith("video/");
    const maxSize = isVideo ? MAX_SIZE_VIDEO : MAX_SIZE_IMAGE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isVideo ? "동영상은 50MB 이하여야 합니다." : "이미지는 10MB 이하여야 합니다." },
        { status: 400 },
      );
    }

    const dirForDate = getUploadDirForDate(new Date());
    ensureUploadDirs(dirForDate);

    const originalName = (file as File).name || "file";
    const filename = safeFilename(originalName);
    const relativePath = getRelativePath(filename);
    const absolutePath = path.join(dirForDate, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(absolutePath, buffer);

    const item = await prisma.galleryItem.create({
      data: {
        title,
        description,
        tags,
        filePath: relativePath,
        groupId: groupId || undefined,
        isCover,
        roundId: roundId ?? undefined,
      },
    });

    return NextResponse.json({
      id: item.id,
      title: item.title,
      description: item.description,
      tags: item.tags,
      filePath: item.filePath,
      groupId: item.groupId,
      isCover: item.isCover,
      roundId: item.roundId,
      imageUrl: getFileUrl(item.filePath, baseUrl),
      createdAt: item.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("Gallery upload error:", e);
    return NextResponse.json(
      { error: "업로드 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
