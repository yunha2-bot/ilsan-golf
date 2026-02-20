import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

function formatDate(date: Date) {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function MemberCourseScoresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  const member = await prisma.member.findUnique({
    where: { id },
  });
  if (!member) notFound();

  const scoresWithRound = await prisma.score.findMany({
    where: { memberId: id },
    include: { round: true },
    orderBy: { round: { date: "desc" } },
  });

  // 코스별로 묶기: { courseName: { rounds: { date, strokes }[], totalStrokes, count } }
  const byCourse = new Map<
    string,
    { date: Date; strokes: number; roundId: number }[]
  >();
  for (const s of scoresWithRound) {
    const course = s.round.course || "코스 미지정";
    if (!byCourse.has(course)) byCourse.set(course, []);
    byCourse.get(course)!.push({
      date: s.round.date,
      strokes: s.strokes,
      roundId: s.round.id,
    });
  }

  // 코스 이름 정렬, 각 코스 내 라운드는 이미 날짜 내림차순
  const courseNames = [...byCourse.keys()].sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
        >
          ← 홈
        </Link>
      </div>
      <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
        <h1 className="text-base font-semibold text-emerald-50">
          {member.name} · 코스별 스코어
        </h1>
        <p className="mt-1 text-[11px] text-emerald-200/85">
          코스별 라운드 기록과 평균
        </p>
      </section>

      {courseNames.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-700/70 bg-emerald-950/40 px-4 py-8 text-center">
          <p className="text-[11px] text-emerald-200/90">
            아직 기록된 라운드가 없습니다.
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          {courseNames.map((course) => {
            const rounds = byCourse.get(course)!;
            const totalStrokes = rounds.reduce((a, r) => a + r.strokes, 0);
            const avg = Math.floor(totalStrokes / rounds.length);
            const best = Math.min(...rounds.map((r) => r.strokes));

            return (
              <div
                key={course}
                className="rounded-2xl border border-emerald-800/70 bg-emerald-950/80 px-4 py-3 shadow-md"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-emerald-50">
                    {course}
                  </p>
                  <p className="text-[10px] text-emerald-200/80">
                    {rounds.length}라운드 · 평균 {avg} · 최저 {best}
                  </p>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {rounds.map((r) => (
                    <li key={r.roundId}>
                      <Link
                        href={`/rounds/${r.roundId}/edit`}
                        className="flex items-center justify-between rounded-lg border border-emerald-800/60 bg-emerald-950/60 px-2.5 py-1.5 text-[11px] text-emerald-100/90 hover:bg-emerald-800/50"
                      >
                        <span>{formatDate(r.date)}</span>
                        <span className="font-semibold text-emerald-50">
                          {r.strokes}타
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
