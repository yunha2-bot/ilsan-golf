"use client";

import { useState } from "react";

const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 16, right: 12, bottom: 28, left: 36 };

export type MemberStatsChartData = {
  member: { name: string };
  overallData: { index: number; date: string; strokes: number }[];
  yearData: { year: number; avg: number; count: number }[];
};

export function MemberStatsCharts({ data }: { data: MemberStatsChartData }) {
  const { member, overallData, yearData } = data;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const bestStrokes = overallData.length ? Math.min(...overallData.map((d) => d.strokes)) : null;
  const bestIndex = bestStrokes !== null ? overallData.findIndex((d) => d.strokes === bestStrokes) : -1;

  const strokeMin = overallData.length
    ? Math.min(60, ...overallData.map((d) => d.strokes)) - 5
    : 55;
  const strokeMax = overallData.length
    ? Math.max(120, ...overallData.map((d) => d.strokes)) + 5
    : 125;
  const chartWidth = Math.max(280, Math.min(500, overallData.length * 28));
  const innerWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const toY = (strokes: number) =>
    CHART_PADDING.top +
    innerHeight -
    ((strokes - strokeMin) / (strokeMax - strokeMin)) * innerHeight;
  const toX = (i: number) =>
    CHART_PADDING.left +
    (overallData.length <= 1
      ? innerWidth / 2
      : (i / (overallData.length - 1)) * innerWidth);

  const linePoints =
    overallData.length > 0
      ? overallData.map((d, i) => `${toX(i)},${toY(d.strokes)}`).join(" ")
      : "";

  // 추세선 (단순 선형 회귀)
  let trendPoints = "";
  if (overallData.length >= 3) {
    const n = overallData.length;
    const xs = overallData.map((_, i) => i);
    const ys = overallData.map((d) => d.strokes);
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    const slope = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0) /
      xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
    const intercept = meanY - slope * meanX;
    const y0 = intercept;
    const y1 = slope * (n - 1) + intercept;
    trendPoints = `${toX(0)},${toY(y0)} ${toX(n - 1)},${toY(y1)}`;
  }

  const hoveredData = hoveredIndex !== null ? overallData[hoveredIndex] : null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
        <h2 className="text-base font-semibold text-emerald-50">
          {member.name} 스코어 그래프
        </h2>
        <p className="mt-1 text-[11px] text-emerald-200/85">
          전체 {overallData.length}라운드
          {bestStrokes !== null && (
            <span className="ml-2 text-amber-400">★ 베스트 {bestStrokes}타</span>
          )}
        </p>
      </section>

      <section className="rounded-2xl border border-emerald-800/70 bg-emerald-950/80 px-4 py-3 shadow-md">
        <h3 className="text-sm font-semibold text-emerald-50">
          전체 스코어 추이
        </h3>
        <p className="mt-0.5 text-[10px] text-emerald-200/80">
          점 위에 올리면 날짜·타수 표시 · 점선: 추세선 · <span className="text-amber-400">★</span> 베스트
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
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* 그리드 라인 */}
              {[strokeMin, Math.round((strokeMin + strokeMax) / 2), strokeMax].map((v) => (
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
                    fontSize="10"
                    fill="rgba(167,243,208,0.7)"
                  >
                    {v}
                  </text>
                </g>
              ))}
              {/* 추세선 */}
              {trendPoints && (
                <polyline
                  points={trendPoints}
                  fill="none"
                  stroke="rgba(251,191,36,0.45)"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
              )}
              {/* 메인 라인 */}
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
              {/* 데이터 포인트 */}
              {overallData.map((d, i) => {
                const isBest = i === bestIndex;
                const isHovered = i === hoveredIndex;
                return (
                  <g key={i}>
                    {/* 호버 영역 */}
                    <rect
                      x={toX(i) - 14}
                      y={CHART_PADDING.top}
                      width={28}
                      height={innerHeight}
                      fill="transparent"
                      onMouseEnter={() => setHoveredIndex(i)}
                    />
                    <circle
                      cx={toX(i)}
                      cy={toY(d.strokes)}
                      r={isBest ? 6 : isHovered ? 5 : 4}
                      fill={isBest ? "rgb(251,191,36)" : isHovered ? "rgb(52,211,153)" : "rgb(52,211,153)"}
                      stroke={isBest ? "rgb(180,130,20)" : "none"}
                      strokeWidth="1.5"
                    />
                    {/* 베스트 별표 */}
                    {isBest && (
                      <text
                        x={toX(i)}
                        y={toY(d.strokes) - 10}
                        textAnchor="middle"
                        fontSize="10"
                        fill="rgb(251,191,36)"
                      >
                        ★
                      </text>
                    )}
                  </g>
                );
              })}
              {/* 호버 툴팁 */}
              {hoveredData && hoveredIndex !== null && (() => {
                const x = toX(hoveredIndex);
                const y = toY(hoveredData.strokes);
                const date = new Date(hoveredData.date);
                const label = `${date.getMonth() + 1}/${date.getDate()} ${hoveredData.strokes}타`;
                const boxW = label.length * 6.5 + 10;
                const boxX = Math.min(x - boxW / 2, chartWidth - boxW - 4);
                return (
                  <g>
                    <line x1={x} y1={CHART_PADDING.top} x2={x} y2={CHART_PADDING.top + innerHeight}
                      stroke="rgba(52,211,153,0.3)" strokeWidth="1" />
                    <rect x={boxX} y={y - 26} width={boxW} height={18} rx="4"
                      fill="rgba(6,78,59,0.95)" stroke="rgba(52,211,153,0.5)" strokeWidth="1" />
                    <text x={boxX + boxW / 2} y={y - 14} textAnchor="middle" fontSize="10"
                      fill="rgb(167,243,208)">
                      {label}
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-emerald-800/70 bg-emerald-950/80 px-4 py-3 shadow-md">
        <h3 className="text-sm font-semibold text-emerald-50">연도별 평균 스코어</h3>
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
              const isBestYear = avg === minAvg;
              const range = maxAvg - minAvg || 1;
              const pct = ((maxAvg - avg) / range) * 80 + 20;
              return (
                <div key={year} className="flex items-center gap-2 text-[11px] min-w-0">
                  <span className="w-10 shrink-0 font-medium text-emerald-100">{year}년</span>
                  <div
                    className="h-6 rounded-md bg-emerald-800/60 overflow-hidden shrink-0"
                    style={{ width: "120px" }}
                    title={`평균 ${avg}타 (${count}라운드)`}
                  >
                    <div
                      className={`h-full rounded-md transition-all min-w-[4px] ${isBestYear ? "bg-amber-500/70" : "bg-emerald-600/80"}`}
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                  <span className={`font-semibold shrink-0 ${isBestYear ? "text-amber-300" : "text-emerald-50"}`}>
                    {avg}타{isBestYear && yearData.length > 1 && " ★"}
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
