import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const notices = await prisma.bettingNotice.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    notices: notices.map((n) => ({
      id: n.id,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "content too long" }, { status: 400 });
  }
  const created = await prisma.bettingNotice.create({ data: { content } });
  return NextResponse.json({
    id: created.id,
    content: created.content,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { id?: number; content?: string };
  const id = Number(body.id);
  const content = body.content?.trim();
  if (!Number.isInteger(id) || id < 1 || !content) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "content too long" }, { status: 400 });
  }
  const updated = await prisma.bettingNotice.update({
    where: { id },
    data: { content },
  });
  return NextResponse.json({
    id: updated.id,
    content: updated.content,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await prisma.bettingNotice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
