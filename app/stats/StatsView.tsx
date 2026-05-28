"use client";

import { useState } from "react";
import Link from "next/link";
import { MemberStatsBottomSheet } from "./_components/MemberStatsBottomSheet";
import { BettingNoticeBoard } from "./_components/BettingNoticeBoard";
import { WinnerComments } from "./winners/_components/WinnerComments";
export type MemberStats = {
  id: number;
  name: string;
  totalRounds: number;
  avgRecent5: number | null;
  avgAll: number | null;
  bestStrokes: number | null;
  /** 부자되세요~용: 최근 5경기 스코어 (최신순) */
  recent5Scores?: number[];
};

type DistCounts = { eagle: number; birdie: number; par: number; bogey: number; double: number; triple: number };
type ScoreDistItem = { id: number; name: string; counts: DistCounts; totalHoles: number };

export type YearMemberStats = {
  id: number;
  name: string;
  totalRounds: number;
  avgAll: number | null;
  bestStrokes: number | null;
};

export type CourseStats = {
  course: string;
  roundCount: number;
  members: { name: string; avg: number | null; rounds: number; best: number | null }[];
};
export type BettingWinnerHistoryItem = {
  winners: string[];
  roundDate: string;
  improvement: number;
  baselineAvg: number;
  winnerStrokes: number[];
};

export function StatsView({
  byMember,
  bettingByMember = [],
  overallCount,
  bettingRoundsCount = 0,
  bettingWinner = null,
  bettingStreak = 0,
  bettingLatestLowest = null,
  latestWinnerNames = [],
  latestWinnerRoundDate = null,
  years = [],
  byYear = {},
  byCourse = [],
  scoreDistribution = [],
}: {
  byMember: MemberStats[];
  bettingByMember?: MemberStats[];
  overallCount: number;
  bettingRoundsCount?: number;
  bettingWinner?: string | null;
  bettingStreak?: number;
  bettingLatestLowest?: string | null;
  latestWinnerNames?: string[];
  latestWinnerRoundDate?: string | null;
  years?: number[];
  byYear?: Record<number, YearMemberStats[]>;
  byCourse?: CourseStats[];
  scoreDistribution?: ScoreDistItem[];
}) {
  const [showBettingOnly, setShowBettingOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | number | "course" | "dist">("all");
  const [sheetMemberId, setSheetMemberId] = useState<number | null>(null);

  const list = showBettingOnly ? bettingByMember : byMember;
  const bettingNameSet = new Set(bettingByMember.map((m) => m.name));
  const latestWinnerKey =
    latestWinnerRoundDate && latestWinnerNames.length > 0
      ? `${latestWinnerRoundDate}|${latestWinnerNames.slice().sort().join("|")}`
      : null;
  const bettingNamesLabel =
    bettingByMember.length > 0
      ? bettingByMember.map((m) => m.name).join("·")
      : "";

  const yearListRaw = typeof viewMode === "number" && viewMode !== 0 ? byYear[viewMode] ?? [] : null;
  const yearList =
    yearListRaw == null
      ? null
      : showBettingOnly
        ? yearListRaw.filter((m) => bettingNameSet.has(m.name))
        : yearListRaw;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-end gap-3 md:gap-4">
        <a
          href="/api/export/csv"
          download="golf-scores.csv"
          className="text-[11px] font-medium text-emerald-300 hover:text-emerald-50"
        >
          CSV 내보내기
        </a>
        <a
          href="/api/export/xlsx"
          download="golf-scores.xlsx"
          className="text-[11px] font-medium text-emerald-300 hover:text-emerald-50"
        >
          엑셀(.xlsx) 내보내기
        </a>
      </div>
      {/* 부자되세요~ (전체일 때만 버튼, 연도 선택 시 텍스트만) + 연도 탭 */}
      <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
        <div className="space-y-2">
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
            <button
              type="button"
              disabled
              className={`text-xs font-semibold ${
                showBettingOnly ? "text-amber-400" : "text-emerald-200/80"
              }`}
            >
              {showBettingOnly ? "전체 보기" : "부자되세요~"}
            </button>
          )}
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
          {!showBettingOnly && (
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
          )}
          {!showBettingOnly && (
            <button
              type="button"
              onClick={() => setViewMode("dist")}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
                viewMode === "dist"
                  ? "bg-emerald-500 text-emerald-950"
                  : "bg-emerald-800/70 text-emerald-100 hover:bg-emerald-700/80"
              }`}
            >
              분포
            </button>
          )}
          </div>
        </div>
      </section>
      {showBettingOnly && <BettingNoticeBoard />}

      {viewMode === "dist" ? (
        <section className="space-y-3">
          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
            <p className="text-sm font-semibold text-emerald-50">스코어 분포 분석</p>
            <p className="mt-1 text-[11px] text-emerald-200/85">전체 라운드 홀별 타입 집계</p>
          </div>
          {scoreDistribution.map((m) => {
            const t = m.totalHoles || 1;
            const pct = (n: number) => t > 0 ? Math.round((n / t) * 100) : 0;
            const rows = [
              { key: "eagle", label: "이글↓", color: "bg-purple-600", count: m.counts.eagle },
              { key: "birdie", label: "버디", color: "bg-blue-500", count: m.counts.birdie },
              { key: "par", label: "파", color: "bg-emerald-700", count: m.counts.par },
              { key: "bogey", label: "보기", color: "bg-yellow-600", count: m.counts.bogey },
              { key: "double", label: "더블", color: "bg-orange-700", count: m.counts.double },
              { key: "triple", label: "트리플↑", color: "bg-red-800", count: m.counts.triple },
            ];
            return (
              <div key={m.id} className="rounded-2xl border border-emerald-800/70 bg-emerald-950/80 px-4 py-3 shadow-md space-y-2">
                <p className="text-sm font-semibold text-emerald-50">{m.name}</p>
                <p className="text-[10px] text-emerald-300/70">{m.totalHoles} 홀 기록</p>
                {rows.map((r) => (
                  <div key={r.key} className="flex items-center gap-2">
                    <span className="w-12 text-[10px] text-emerald-200/80 text-right">{r.label}</span>
                    <div className="flex-1 h-4 rounded-full bg-emerald-900/60 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${r.color}`}
                        style={{ width: `${Math.max(pct(r.count), r.count > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                    <span className="w-16 text-[10px] text-emerald-100 text-right">
                      {r.count}회 ({pct(r.count)}%)
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </section>
      ) : viewMode === "course" ? (
        <section className="space-y-3">
          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
            <p className="text-sm font-semibold text-emerald-50">
              코스별 멤버 평균 스코어
            </p>
            <p className="mt-1 text-[11px] text-emerald-200/85">
              해당 코스에서 치른 라운드만 집계
            </p>
          </div>
          {byCourse.map((c) => {
            const visibleMembers = showBettingOnly
              ? c.members.filter((m) => bettingNameSet.has(m.name))
              : c.members;
            return (
            <div
              key={c.course}
              className="rounded-2xl border border-emerald-800/70 bg-emerald-950/80 px-4 py-3 shadow-md"
            >
              <p className="text-sm font-semibold text-emerald-50">{c.course}</p>
              <p className="mt-0.5 text-[10px] text-emerald-200/80">{c.roundCount} 라운드 · 베스트 스코어 <span className="text-amber-400/80">★</span></p>
              <div className="mt-2 space-y-1.5">
                {visibleMembers.map((m) => {
                  const isBest = m.best !== null && visibleMembers
                    .filter((x) => x.best !== null)
                    .every((x) => m.best! <= x.best!);
                  return (
                  <div
                    key={m.name}
                    className="flex justify-between text-[11px] text-emerald-100/90"
                  >
                    <span>{m.name}</span>
                    <span className="flex items-center gap-1.5">
                      {m.rounds > 0 && m.avg !== null
                        ? `평균 ${Math.floor(m.avg)} (${m.rounds}회)`
                        : "-"}
                      {m.best !== null && (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${isBest ? "bg-amber-500/30 text-amber-300" : "bg-emerald-900/60 text-emerald-400"}`}>
                          {isBest ? "★ " : ""}{m.best}
                        </span>
                      )}
                    </span>
                  </div>
                  );
                })}
              </div>
            </div>
          )})}
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
            <button
              key={m.id}
              type="button"
              onClick={() => setSheetMemberId(m.id)}
              className="w-full text-left rounded-2xl border border-emerald-800/70 bg-gradient-to-r from-emerald-950/95 via-emerald-900/95 to-emerald-950/95 px-4 py-3 shadow-md shadow-emerald-950/70 hover:border-emerald-600/80 transition"
            >
              <article className="flex items-center justify-between">
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
                    {m.avgAll !== null ? Math.floor(m.avgAll) : "-"}
                  </p>
                </div>
              </article>
            </button>
          ))}
        </section>
      ) : (
        <>
      <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 md:px-5 md:py-4 shadow-lg shadow-emerald-950/60">
        <div className="flex items-center justify-between">
          <p className="text-sm md:text-base font-semibold text-emerald-50">
            멤버별 평균 스코어
          </p>
        </div>
        <p className="mt-1 text-[11px] text-emerald-200/85">
            {showBettingOnly
              ? bettingRoundsCount > 0
                ? `부자되세요~${bettingNamesLabel ? ` (${bettingNamesLabel})` : ""} 세 명 모두 참여한 최근 ${bettingRoundsCount}경기 평균`
                : "세 명 모두 참여한 라운드가 없으면 평균을 내지 않습니다."
              : "전체 기록 평균 (그로스)"}
        </p>
        {overallCount === 0 && (
          <p className="mt-2 text-[11px] text-emerald-200/80">
            아직 기록된 스코어가 없어 평균을 계산할 수 없습니다.
          </p>
        )}
      </section>

      {showBettingOnly && (bettingWinner || bettingLatestLowest) && (
        <section className="rounded-2xl border border-amber-700/60 bg-amber-950/50 px-4 py-3 shadow-lg space-y-3">
          {bettingWinner ? (
            <>
              <p className="text-[11px] font-medium tracking-wider text-amber-300/90">
                최근 경기 우승 (평균 대비 가장 많이 줄인 사람)
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-amber-100">
                <span aria-hidden>👑</span>
                <Link
                  href="/stats/winners"
                  className="underline decoration-amber-400/80 underline-offset-2 hover:text-amber-50"
                >
                  {bettingWinner}
                </Link>
                {bettingStreak >= 2 && (
                  <span className="rounded-full bg-amber-600/80 px-2 py-0.5 text-[11px] font-bold text-amber-950">
                    {bettingStreak}연승
                  </span>
                )}
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-medium tracking-wider text-amber-300/90">
                이번 경기 최저 (1등)
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-amber-100">
                <span aria-hidden>👑</span>
                <span>{bettingLatestLowest}</span>
              </p>
            </>
          )}
          {latestWinnerKey && latestWinnerRoundDate && (
            <WinnerComments
              winnersKey={latestWinnerKey}
              roundDateIso={latestWinnerRoundDate}
              authorOptions={["익명", ...bettingByMember.map((m) => m.name)]}
            />
          )}
        </section>
      )}
      <section className="space-y-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        {list.map((m) => {
          return (
            <div
              key={m.id}
              className="rounded-2xl border border-emerald-800/70 bg-gradient-to-r from-emerald-950/95 via-emerald-900/95 to-emerald-950/95 px-4 py-3 md:px-5 md:py-4 shadow-md shadow-emerald-950/70"
            >
              <article className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSheetMemberId(m.id)}
                  className="flex-1 text-left"
                >
                  <p className="text-sm font-semibold text-emerald-50">{m.name}</p>
                  <p className="mt-1 text-[11px] text-emerald-100/80">
                    {m.totalRounds > 0 ? `${m.totalRounds} 라운드 기록` : "아직 기록 없음"}
                    {m.bestStrokes !== null && ` · 최저 ${m.bestStrokes}`}
                  </p>
                </button>
                <div className="text-right flex-shrink-0">
                  {showBettingOnly ? (
                    <>
                      <p className="text-[11px] text-emerald-200/80">최근 5경기 평균</p>
                      <p className="mt-0.5 text-sm font-semibold text-emerald-50">
                        {m.avgRecent5 !== null ? Math.floor(m.avgRecent5) : "-"}
                      </p>
                      {m.recent5Scores && m.recent5Scores.length > 0 && (
                        <p className="mt-1 text-[10px] text-emerald-300/75">
                          스코어: {m.recent5Scores.join(" · ")}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] text-emerald-300/75">
                        전체 평균 {m.avgAll !== null ? Math.floor(m.avgAll) : "-"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-emerald-200/80">전체 평균</p>
                      <p className="mt-0.5 text-sm font-semibold text-emerald-50">
                        {m.avgAll !== null ? Math.floor(m.avgAll) : "-"}
                      </p>
                    </>
                  )}
                </div>
              </article>
            </div>
          );
        })}
      </section>

        </>
      )}
      <MemberStatsBottomSheet
        memberId={sheetMemberId}
        onClose={() => setSheetMemberId(null)}
      />
    </div>
  );
}
