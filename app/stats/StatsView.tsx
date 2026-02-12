"use client";

import { useState } from "react";

/** 내기 멤버 (김상우 제외) */
const BETTING_MEMBER_NAMES = ["김동원", "이문림", "신윤하"] as const;

export type MemberStats = {
  name: string;
  totalRounds: number;
  avgRecent5: number | null;
  avgAll: number | null;
  bestStrokes: number | null;
};

export type YearMemberStats = {
  name: string;
  totalRounds: number;
  avgAll: number | null;
  bestStrokes: number | null;
};

export type CourseStats = {
  course: string;
  roundCount: number;
  members: { name: string; avg: number | null; rounds: number }[];
};

export function StatsView({
  byMember,
  overallCount,
  bettingRoundsCount = 0,
  bettingWinner = null,
  bettingStreak = 0,
  years = [],
  byYear = {},
  byCourse = [],
}: {
  byMember: MemberStats[];
  overallCount: number;
  bettingRoundsCount?: number;
  bettingWinner?: string | null;
  bettingStreak?: number;
  years?: number[];
  byYear?: Record<number, YearMemberStats[]>;
  byCourse?: CourseStats[];
}) {
  const [showBettingOnly, setShowBettingOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | number | "course">("all");

  const list = showBettingOnly
    ? byMember.filter((m) =>
        (BETTING_MEMBER_NAMES as readonly string[]).includes(m.name),
      )
    : byMember;

  const yearList = typeof viewMode === "number" ? byYear[viewMode] ?? [] : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a
          href="/api/export/csv"
          download="golf-scores.csv"
          className="text-[11px] font-medium text-emerald-300 hover:text-emerald-50"
        >
          CSV 내보내기
        </a>
      </div>
      {/* 부자되세요~ (전체일 때만 버튼, 연도 선택 시 텍스트만) + 연도 탭 */}
      <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
        <div className="mb-2">
          {viewMode === "all" ? (
            <button
              type="button"
              onClick={() => setShowBettingOnly((v) => !v)}
              className={`text-xs font-semibold transition ${
                showBettingOnly ? "text-amber-400" : "text-emerald-200 hover:text-emerald-50"
              }`}
            >
              {showBettingOnly ? "전체 보기" : "부자되세요~"}
            </button>
          ) : (
            <span className="text-xs font-semibold text-emerald-200/80">
              부자되세요~
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
              viewMode === "all"
                ? "bg-emerald-500 text-emerald-950"
                : "bg-emerald-800/70 text-emerald-100 hover:bg-emerald-700/80"
            }`}
          >
            전체
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setViewMode(y)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
                viewMode === y
                  ? "bg-emerald-500 text-emerald-950"
                  : "bg-emerald-800/70 text-emerald-100 hover:bg-emerald-700/80"
              }`}
            >
              {y}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setViewMode("course")}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
              viewMode === "course"
                ? "bg-emerald-500 text-emerald-950"
                : "bg-emerald-800/70 text-emerald-100 hover:bg-emerald-700/80"
            }`}
          >
            코스별
          </button>
        </div>
      </section>

      {viewMode === "course" ? (
        <section className="space-y-3">
          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
            <p className="text-sm font-semibold text-emerald-50">
              코스별 멤버 평균 스코어
            </p>
            <p className="mt-1 text-[11px] text-emerald-200/85">
              해당 코스에서 치른 라운드만 집계
            </p>
          </div>
          {byCourse.map((c) => (
            <div
              key={c.course}
              className="rounded-2xl border border-emerald-800/70 bg-emerald-950/80 px-4 py-3 shadow-md"
            >
              <p className="text-sm font-semibold text-emerald-50">{c.course}</p>
              <p className="mt-0.5 text-[10px] text-emerald-200/80">{c.roundCount} 라운드</p>
              <div className="mt-2 space-y-1.5">
                {c.members.map((m) => (
                  <div
                    key={m.name}
                    className="flex justify-between text-[11px] text-emerald-100/90"
                  >
                    <span>{m.name}</span>
                    <span>
                      {m.rounds > 0 && m.avg !== null
                        ? `평균 ${m.avg.toFixed(1)} (${m.rounds}회)`
                        : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : typeof viewMode === "number" ? (
        <section className="space-y-2">
          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
            <p className="text-sm font-semibold text-emerald-50">
              {viewMode}년 멤버별 평균 스코어
            </p>
            <p className="mt-1 text-[11px] text-emerald-200/85">
              해당 연도에 치른 라운드만 집계
            </p>
          </div>
          {yearList?.map((m) => (
            <article
              key={m.name}
              className="flex items-center justify-between rounded-2xl border border-emerald-800/70 bg-gradient-to-r from-emerald-950/95 via-emerald-900/95 to-emerald-950/95 px-4 py-3 shadow-md shadow-emerald-950/70"
            >
              <div>
                <p className="text-sm font-semibold text-emerald-50">{m.name}</p>
                <p className="mt-1 text-[11px] text-emerald-100/80">
                  {m.totalRounds > 0
                    ? `${m.totalRounds} 라운드 기록`
                    : "아직 기록 없음"}
                  {m.bestStrokes !== null && ` · 최저 ${m.bestStrokes}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-emerald-200/80">평균</p>
                <p className="mt-0.5 text-sm font-semibold text-emerald-50">
                  {m.avgAll !== null ? m.avgAll.toFixed(1) : "-"}
                </p>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <>
      <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
        <div>
          <p className="text-sm font-semibold text-emerald-50">
            멤버별 평균 스코어
          </p>
          <p className="mt-1 text-[11px] text-emerald-200/85">
            {showBettingOnly
              ? bettingRoundsCount > 0
                ? `부자되세요~ (김동원·이문림·신윤하) 세 명 모두 참여한 최근 ${bettingRoundsCount}경기 평균`
                : "세 명 모두 참여한 라운드가 없으면 평균을 내지 않습니다."
              : "전체 기록 평균"}
          </p>
        </div>
        {overallCount === 0 && (
          <p className="mt-2 text-[11px] text-emerald-200/80">
            아직 기록된 스코어가 없어 평균을 계산할 수 없습니다.
          </p>
        )}
      </section>

      {showBettingOnly && bettingWinner && (
        <section className="rounded-2xl border border-amber-700/60 bg-amber-950/50 px-4 py-3 shadow-lg">
          <p className="text-[11px] font-medium tracking-wider text-amber-300/90">
            최근 경기 우승 (평균 대비 가장 많이 줄인 사람)
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-amber-100">
            <span aria-hidden>👑</span>
            <span>{bettingWinner}</span>
            {bettingStreak >= 2 && (
              <span className="rounded-full bg-amber-600/80 px-2 py-0.5 text-[11px] font-bold text-amber-950">
                {bettingStreak}연승
              </span>
            )}
          </p>
        </section>
      )}

      <section className="space-y-2">
        {list.map((m) => (
          <article
            key={m.name}
            className="flex items-center justify-between rounded-2xl border border-emerald-800/70 bg-gradient-to-r from-emerald-950/95 via-emerald-900/95 to-emerald-950/95 px-4 py-3 shadow-md shadow-emerald-950/70"
          >
            <div>
              <p className="text-sm font-semibold text-emerald-50">
                {m.name}
              </p>
              <p className="mt-1 text-[11px] text-emerald-100/80">
                {m.totalRounds > 0
                  ? `${m.totalRounds} 라운드 기록`
                  : "아직 기록 없음"}
                {m.bestStrokes !== null && ` · 최저 ${m.bestStrokes}`}
              </p>
            </div>
            <div className="text-right">
              {showBettingOnly ? (
                <>
                  <p className="text-[11px] text-emerald-200/80">최근 5경기 평균</p>
                  <p className="mt-0.5 text-sm font-semibold text-emerald-50">
                    {m.avgRecent5 !== null ? m.avgRecent5.toFixed(1) : "-"}
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-300/75">
                    전체 평균 {m.avgAll !== null ? m.avgAll.toFixed(1) : "-"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[11px] text-emerald-200/80">전체 평균</p>
                  <p className="mt-0.5 text-sm font-semibold text-emerald-50">
                    {m.avgAll !== null ? m.avgAll.toFixed(1) : "-"}
                  </p>
                </>
              )}
            </div>
          </article>
        ))}
      </section>
        </>
      )}
    </div>
  );
}
