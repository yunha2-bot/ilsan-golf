import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 12, right: 12, bottom: 28, left: 36 };

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function MemberStatsGraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) notFound();

  const scoresWithRound = await prisma.score.findMany({
    where: { memberId: id },
    include: { round: true },
    orderBy: { round: { date: "asc" } },
  });

  // 전체 스코어: 라운드 순서(1~N) → 타수
  const overallData = scoresWithRound.map((s, i) => ({
    index: i + 1,
    date: s.round.date,
    strokes: s.strokes,
  }));

  // 연도별: 년도 → 평균 타수, 라운드 수
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

  const strokeMin = overallData.length
    ? Math.min(60, ...overallData.map((d) => d.strokes)) - 5
    : 55;
  const strokeMax = overallData.length
    ? Math.max(120, ...overallData.map((d) => d.strokes)) + 5
    : 125;
  const chartWidth = Math.max(280, Math.min(400, overallData.length * 24));
  const innerWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const toY = (strokes: number) =>
    CHART_PADDING.top +
    innerHeight -
    ((strokes - strokeMin) / (strokeMax - strokeMin)) * innerHeight;
  const toX = (i: number) =>
    CHART_PADDING.left +
    (overallData.length <= 1 ? innerWidth / 2 : (i / (overallData.length - 1)) * innerWidth);

  const linePoints =
    overallData.length > 0
      ? overallData
          .map((d, i) => `${toX(i)},${toY(d.strokes)}`)
          .join(" ")
      : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/stats"
          className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
        >
          ← 평균 스코어
        </Link>
      </div>

      <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
        <h1 className="text-base font-semibold text-emerald-50">
          {member.name} 스코어 그래프
        </h1>
        <p className="mt-1 text-[11px] text-emerald-200/85">
          전체 {scoresWithRound.length}라운드
        </p>
      </section>

      {/* 전체 스코어 그래프 (라운드 순서별 타수) */}
      <section className="rounded-2xl border border-emerald-800/70 bg-emerald-950/80 px-4 py-3 shadow-md">
        <h2 className="text-sm font-semibold text-emerald-50">
          전체 스코어 (라운드 순)
        </h2>
        <p className="mt-0.5 text-[10px] text-emerald-200/80">
          가로: 1경기 → 최근 경기 순, 세로: 타수
        </p>
        {overallData.length === 0 ? (
          <p className="mt-4 py-8 text-center text-[11px] text-emerald-300/70">
            기록된 라운드가 없습니다.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <svg
              width={chartWidth}
              height={CHART_HEIGHT}
              className="min-w-0"
              aria-hidden
            >
              {/* Y축 눈금 */}
              {[strokeMin, Math.round((strokeMin + strokeMax) / 2), strokeMax].map(
                (v) => (
                  <g key={v}>
                    <line
                      x1={CHART_PADDING.left}
                      y1={toY(v)}
                      x2={CHART_PADDING.left + innerWidth}
                      y2={toY(v)}
                      stroke="rgba(16, 185, 129, 0.2)"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                    />
                    <text
                      x={CHART_PADDING.left - 6}
                      y={toY(v)}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="fill-emerald-200/90 text-[10px]"
                    >
                      {v}
                    </text>
                  </g>
                )
              )}
              {/* 라인 */}
              {linePoints && (
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="rgb(16, 185, 129)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* 포인트 */}
              {overallData.map((d, i) => (
                <circle
                  key={i}
                  cx={toX(i)}
                  cy={toY(d.strokes)}
                  r="4"
                  className="fill-emerald-400"
                />
              ))}
            </svg>
          </div>
        )}
      </section>

      {/* 연도별 평균 그래프 */}
      <section className="rounded-2xl border border-emerald-800/70 bg-emerald-950/80 px-4 py-3 shadow-md">
        <h2 className="text-sm font-semibold text-emerald-50">
          연도별 평균 스코어
        </h2>
        <p className="mt-0.5 text-[10px] text-emerald-200/80">
          해당 연도 평균 타수 (괄호 안은 라운드 수)
        </p>
        {yearData.length === 0 ? (
          <p className="mt-4 py-8 text-center text-[11px] text-emerald-300/70">
            기록된 라운드가 없습니다.
          </p>
        ) : (
          <div className="mt-3 space-y-2 max-w-full overflow-hidden">
            {yearData.map(({ year, avg, count }) => {
              const maxAvg = Math.max(...yearData.map((y) => y.avg));
              const minAvg = Math.min(...yearData.map((y) => y.avg));
              const range = maxAvg - minAvg || 1;
              const pct = ((maxAvg - avg) / range) * 80 + 20;
              return (
                <div
                  key={year}
                  className="flex items-center gap-2 text-[11px] min-w-0"
                >
                  <span className="w-10 shrink-0 font-medium text-emerald-100">
                    {year}년
                  </span>
                  <div
                    className="h-6 rounded-md bg-emerald-800/60 overflow-hidden shrink-0"
                    style={{ width: "120px" }}
                    title={`평균 ${avg}타 (${count}라운드)`}
                  >
                    <div
                      className="h-full rounded-md bg-emerald-600/80 transition-all min-w-[4px]"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                  <span className="text-emerald-50 font-semibold shrink-0">
                    {avg}타
                  </span>
                  <span className="text-emerald-300/80 shrink-0">({count}회)</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
