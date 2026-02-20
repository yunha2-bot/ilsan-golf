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

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function safeFilename(original: string): string {
  const ext = path.extname(original) || ".jpg";
  const base = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return base + ext.toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
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
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "이미지 파일이 필요합니다." },
        { status: 400 },
      );
    }

    const type = file.type;
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "지원 형식: JPEG, PNG, GIF, WebP" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 10MB 이하여야 합니다." },
        { status: 400 },
      );
    }

    const dirForDate = getUploadDirForDate(new Date());
    ensureUploadDirs(dirForDate);

    const originalName = (file as File).name || "image";
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
      imageUrl: getFileUrl(item.filePath),
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
