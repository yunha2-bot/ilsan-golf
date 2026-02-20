import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

function formatDate(date: Date) {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

export default async function RoundMemberScorePage({
  params,
}: {
  params: Promise<{ id: string; memberId: string }>;
}) {
  const roundId = Number((await params).id);
  const memberId = Number((await params).memberId);
  if (!Number.isInteger(roundId) || roundId < 1 || !Number.isInteger(memberId) || memberId < 1) {
    notFound();
  }

  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { scores: { include: { member: true } } },
  });
  if (!round) notFound();

  const [courseRow, scoreRow] = await Promise.all([
    prisma.course.findUnique({ where: { name: round.course } }),
    prisma.score.findFirst({
      where: { roundId, memberId },
      include: { member: true },
    }),
  ]);
  if (!scoreRow) notFound();

  const member = scoreRow.member;
  const score = scoreRow;
  const par = courseRow
    ? [
        courseRow.par1,
        courseRow.par2,
        courseRow.par3,
        courseRow.par4,
        courseRow.par5,
        courseRow.par6,
        courseRow.par7,
        courseRow.par8,
        courseRow.par9,
        courseRow.par10,
        courseRow.par11,
        courseRow.par12,
        courseRow.par13,
        courseRow.par14,
        courseRow.par15,
        courseRow.par16,
        courseRow.par17,
        courseRow.par18,
      ]
    : Array(18).fill(4);

  const holes1_9 = [score.h1, score.h2, score.h3, score.h4, score.h5, score.h6, score.h7, score.h8, score.h9];
  const holes10_18 = [
    score.h10,
    score.h11,
    score.h12,
    score.h13,
    score.h14,
    score.h15,
    score.h16,
    score.h17,
    score.h18,
  ];
  const par1_9 = par.slice(0, 9);
  const par10_18 = par.slice(9, 18);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
        >
          ← 홈
        </Link>
        <span className="text-[11px] text-emerald-400/80">|</span>
        <Link
          href={`/rounds/${roundId}/edit`}
          className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
        >
          라운드 수정
        </Link>
      </div>

      <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
        <h1 className="text-sm font-semibold text-emerald-50">
          {round.course || "코스 미지정"} · {formatDate(round.date)}
        </h1>
        <p className="mt-1 text-[11px] font-medium text-emerald-200/90">
          {member.name} 스코어카드
        </p>
        <p className="mt-0.5 text-[10px] text-emerald-300/80">
          Total {score.strokes}타
        </p>
      </section>

      <section className="rounded-2xl border border-emerald-800/70 bg-emerald-950/80 px-3 py-3 shadow-md overflow-x-auto">
        <table className="w-full min-w-[320px] text-center border-collapse">
          <thead>
            <tr>
              <th className="text-[10px] font-medium text-emerald-300/80 w-8 py-1" scope="col">
                홀
              </th>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => (
                <th
                  key={h}
                  className="w-8 py-1 text-[10px] font-medium text-emerald-300/80"
                  scope="col"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 pr-1 text-[10px] font-medium text-emerald-300/90 align-bottom">
                Par
              </td>
              {par1_9.map((p, i) => (
                <td key={i} className="py-1 text-[11px] text-emerald-200/90">
                  {p}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-1 pr-1 text-[10px] font-medium text-emerald-300/90 align-bottom">
                스코어
              </td>
              {holes1_9.map((s, i) => (
                <td key={i} className="py-1 text-xs font-semibold text-emerald-50">
                  {s}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <table className="w-full min-w-[320px] text-center border-collapse mt-3">
          <thead>
            <tr>
              <th className="text-[10px] font-medium text-emerald-300/80 w-8 py-1" scope="col">
                홀
              </th>
              {[10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => (
                <th
                  key={h}
                  className="w-8 py-1 text-[10px] font-medium text-emerald-300/80"
                  scope="col"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 pr-1 text-[10px] font-medium text-emerald-300/90 align-bottom">
                Par
              </td>
              {par10_18.map((p, i) => (
                <td key={i} className="py-1 text-[11px] text-emerald-200/90">
                  {p}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-1 pr-1 text-[10px] font-medium text-emerald-300/90 align-bottom">
                스코어
              </td>
              {holes10_18.map((s, i) => (
                <td key={i} className="py-1 text-xs font-semibold text-emerald-50">
                  {s}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
