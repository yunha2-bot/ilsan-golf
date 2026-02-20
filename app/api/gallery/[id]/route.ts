import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { prisma } from "@/lib/prisma";
import { resolveAbsolutePath } from "@/lib/uploadConfig";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 },
      );
    }
    const body = await req.json().catch(() => ({}));
    const tagsRaw = typeof body.tags === "string" ? body.tags.trim() : "";
    const tags = tagsRaw
      ? tagsRaw
          .split(/[,，\s]+/)
          .map((t: string) => t.trim())
          .filter(Boolean)
          .join(",")
      : "";
    const item = await prisma.galleryItem.update({
      where: { id },
      data: { tags },
    });
    return NextResponse.json({
      id: item.id,
      title: item.title,
      description: item.description,
      tags: item.tags,
      filePath: item.filePath,
      createdAt: item.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("Gallery patch error:", e);
    return NextResponse.json(
      { error: "수정 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const item = await prisma.galleryItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json(
        { error: "해당 사진을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // filePath가 있을 때만 디스크 파일 삭제 (빈 문자열이면 예전 DB 저장분 등이라 파일 없음)
    if (item.filePath) {
      const absolutePath = resolveAbsolutePath(item.filePath);
      if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
        fs.unlinkSync(absolutePath);
      }
    }

    await prisma.galleryItem.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Gallery delete error:", e);
    return NextResponse.json(
      { error: "삭제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
