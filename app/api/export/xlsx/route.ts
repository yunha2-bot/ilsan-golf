import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET() {
  const members = await prisma.member.findMany({ orderBy: { id: "asc" } });
  const memberList = members.slice(0, 4);
  const rounds = await prisma.round.findMany({
    orderBy: { date: "desc" },
    include: { scores: { include: { member: true } } },
  });

  const header = ["날짜", "코스", ...memberList.map((m) => m.name)];
  const rows: (string | number)[][] = [header];

  for (const r of rounds) {
    const dateStr = r.date.toISOString().slice(0, 10);
    const byMember = new Map(r.scores.map((s) => [s.member.name, s.strokes]));
    const row: (string | number)[] = [
      dateStr,
      r.course ?? "",
      ...memberList.map((m) => byMember.get(m.name) ?? ""),
    ];
    rows.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "스코어");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="golf-scores.xlsx"',
    },
  });
}
