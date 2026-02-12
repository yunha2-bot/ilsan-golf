import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const members = await prisma.member.findMany({ orderBy: { id: "asc" } });
  const memberList = members.slice(0, 4);
  const rounds = await prisma.round.findMany({
    orderBy: { date: "desc" },
    include: { scores: { include: { member: true } } },
  });

  const header = [
    "날짜",
    "코스",
    ...memberList.map((m) => m.name),
  ];
  const rows: string[][] = [header];

  for (const r of rounds) {
    const dateStr = r.date.toISOString().slice(0, 10);
    const byMember = new Map(r.scores.map((s) => [s.member.name, s.strokes]));
    const row = [
      dateStr,
      r.course ?? "",
      ...memberList.map((m) => (byMember.get(m.name) ?? "")),
    ];
    rows.push(row.map((c) => escapeCsvCell(c)));
  }

  const csv = rows.map((row) => row.join(",")).join("\n");
  const bom = "\uFEFF";
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="golf-scores.csv"',
    },
  });
}
