import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { prisma } from "@/lib/prisma";
import { resolveAbsolutePath } from "@/lib/uploadConfig";

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

    const absolutePath = resolveAbsolutePath(item.filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
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
