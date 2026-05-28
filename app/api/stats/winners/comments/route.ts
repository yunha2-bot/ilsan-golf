import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const winnersKey = request.nextUrl.searchParams.get("winnersKey");
  if (!winnersKey) {
    return NextResponse.json({ error: "winnersKey is required" }, { status: 400 });
  }

  const comments = await prisma.winnerComment.findMany({
    where: { winnersKey },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      author: c.author,
      message: c.message,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    winnersKey?: string;
    roundDate?: string;
    author?: string;
    message?: string;
  };

  const winnersKey = body.winnersKey?.trim();
  const roundDate = body.roundDate;
  const author = body.author?.trim() || "익명";
  const message = body.message?.trim();

  if (!winnersKey || !roundDate || !message) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  if (message.length > 200) {
    return NextResponse.json({ error: "message too long" }, { status: 400 });
  }

  const created = await prisma.winnerComment.create({
    data: {
      winnersKey,
      roundDate: new Date(roundDate),
      author,
      message,
    },
  });

  return NextResponse.json({
    id: created.id,
    author: created.author,
    message: created.message,
    createdAt: created.createdAt.toISOString(),
  });
}

export async function DELETE(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  await prisma.winnerComment.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
