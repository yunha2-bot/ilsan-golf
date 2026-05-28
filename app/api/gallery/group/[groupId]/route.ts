import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await params;
    const decoded = decodeURIComponent(groupId);
    const body = await req.json().catch(() => ({}));

    if (!("roundId" in body)) {
      return NextResponse.json({ error: "roundId가 필요합니다." }, { status: 400 });
    }

    const roundId = body.roundId === null ? null : Number(body.roundId) || null;

    if (decoded.startsWith("single-")) {
      const id = Number(decoded.replace("single-", ""));
      await prisma.galleryItem.update({ where: { id }, data: { roundId } });
    } else {
      await prisma.galleryItem.updateMany({
        where: { groupId: decoded },
        data: { roundId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Gallery group patch error:", e);
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
