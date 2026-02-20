import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const scoresWithRound = await prisma.score.findMany({
    where: { memberId: id },
    include: { round: true },
    orderBy: { round: { date: "asc" } },
  });

  const overallData = scoresWithRound.map((s, i) => ({
    index: i + 1,
    date: s.round.date.toISOString(),
    strokes: s.strokes,
  }));

  const byYearMap = new Map<number, number[]>();
  for (const s of scoresWithRound) {
    const y = new Date(s.round.date).getFullYear();
    if (!byYearMap.has(y)) byYearMap.set(y, []);
    byYearMap.get(y)!.push(s.strokes);
  }
  const yearData = [...byYearMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, strokes]) => ({
      year,
      avg: Math.floor(strokes.reduce((a, b) => a + b, 0) / strokes.length),
      count: strokes.length,
    }));

  return NextResponse.json({
    member: { name: member.name },
    overallData,
    yearData,
  });
}
