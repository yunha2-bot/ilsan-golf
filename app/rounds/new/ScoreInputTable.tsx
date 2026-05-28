"use client";

import { useState, useMemo } from "react";

type ScoresMatrix = number[][];

export type MemberOption = { id: number; name: string };

function defaultScores(len: number): ScoresMatrix {
  return Array.from({ length: len }, () => Array.from({ length: 18 }, () => 0));
}

function getScoreColor(overUnder: number): string {
  if (overUnder <= -2) return "bg-purple-600/80 text-purple-50 border-purple-500/60";
  if (overUnder === -1) return "bg-blue-500/80 text-blue-50 border-blue-400/60";
  if (overUnder === 0) return "bg-emerald-900/80 text-emerald-100 border-emerald-700/60";
  if (overUnder === 1) return "bg-yellow-700/80 text-yellow-50 border-yellow-600/60";
  if (overUnder === 2) return "bg-orange-700/80 text-orange-50 border-orange-600/60";
  return "bg-red-800/80 text-red-50 border-red-700/60";
}

function getScoreLabel(overUnder: number, par: number): string {
  const actual = par + overUnder;
  if (actual === 1) return "HIO";
  if (overUnder <= -3) return "알바";
  if (overUnder === -2) return "이글";
  if (overUnder === -1) return "버디";
  if (overUnder === 0) return "파";
  if (overUnder === 1) return "보기";
  if (overUnder === 2) return "더블";
  return `+${overUnder}`;
}

type Props = {
  members: MemberOption[];
  initialScores?: ScoresMatrix;
  coursePar?: number[];
};

export function ScoreInputTable({ members, initialScores, coursePar }: Props) {
  const len = members.length;
  const PAR_DEFAULT = Array.from({ length: 18 }, () => 4);
  const par = coursePar ?? PAR_DEFAULT;
  const parTotal = par.reduce((a, b) => a + b, 0);

  const [scores, setScores] = useState<ScoresMatrix>(
    () => initialScores ?? defaultScores(len),
  );
  const [activeMemberIndex, setActiveMemberIndex] = useState<number | null>(null);

  // members 배열이 바뀌면 scores를 맞춤 (선택 멤버 변경 대응)
  const effectiveScores: ScoresMatrix = useMemo(() => {
    if (scores.length === len) return scores;
    const next = defaultScores(len);
    for (let i = 0; i < Math.min(len, scores.length); i++) {
      next[i] = scores[i] ?? Array(18).fill(0);
    }
    return next;
  }, [len, scores]);

  const totalsByMember = useMemo(
    () =>
      effectiveScores.map((row) =>
        row.reduce((s, v, i) => s + par[i] + (Number.isFinite(v) ? v : 0), 0),
      ),
    [effectiveScores, par],
  );

  const adjustScore = (memberIdx: number, holeIdx: number, delta: number) => {
    const current = effectiveScores[memberIdx]?.[holeIdx] ?? 0;
    const minVal = -(par[holeIdx] - 1); // 최소 1타
    const maxVal = 9;
    const next = Math.max(minVal, Math.min(maxVal, current + delta));
    setScores((prev) => {
      const updated = prev.map((row) => [...row]);
      if (!updated[memberIdx]) updated[memberIdx] = Array(18).fill(0);
      updated[memberIdx][holeIdx] = next;
      return updated;
    });
  };

  const activeScores = activeMemberIndex !== null ? (effectiveScores[activeMemberIndex] ?? []) : [];

  return (
    <div className="space-y-4">
      {/* 멤버 탭 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-emerald-200/85">
          멤버를 선택한 뒤 각 홀의 +/- 버튼으로 스코어를 입력하세요.
        </span>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m, idx) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMemberIndex(activeMemberIndex === idx ? null : idx)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
                activeMemberIndex === idx
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-emerald-950/70 text-emerald-100/85 border border-emerald-700/70"
              }`}
            >
              {m.name}
              {totalsByMember[idx] !== parTotal && (
                <span className="ml-1 opacity-80">{totalsByMember[idx]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 활성 멤버 홀별 입력 */}
      {activeMemberIndex !== null && (
        <div className="rounded-2xl border border-emerald-800/70 bg-emerald-950/80 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-50">
              {members[activeMemberIndex].name}
            </p>
            <p className="text-[11px] text-emerald-300/80">
              총점 <span className="font-semibold text-emerald-50">{totalsByMember[activeMemberIndex]}</span>
            </p>
          </div>

          {/* 전반 (1~9홀) */}
          <div>
            <p className="mb-2 text-[10px] font-medium text-emerald-300/80">전반 (1~9홀)</p>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 9 }).map((_, holeIdx) => {
                const val = activeScores[holeIdx] ?? 0;
                const holePar = par[holeIdx];
                const colorClass = getScoreColor(val);
                const label = getScoreLabel(val, holePar);
                return (
                  <div
                    key={holeIdx}
                    className={`rounded-xl border p-2 text-center ${colorClass}`}
                  >
                    <p className="text-[9px] font-medium opacity-75">
                      {holeIdx + 1}홀 · P{holePar}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold">{label}</p>
                    <p className="text-[11px] font-bold">{holePar + val}</p>
                    <div className="mt-1.5 flex justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustScore(activeMemberIndex, holeIdx, -1)}
                        className="h-7 w-7 rounded-lg bg-black/20 text-sm font-bold leading-none hover:bg-black/40 active:scale-95"
                        aria-label={`${holeIdx + 1}홀 타수 줄이기`}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustScore(activeMemberIndex, holeIdx, 1)}
                        className="h-7 w-7 rounded-lg bg-black/20 text-sm font-bold leading-none hover:bg-black/40 active:scale-95"
                        aria-label={`${holeIdx + 1}홀 타수 늘리기`}
                      >
                        ＋
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 후반 (10~18홀) */}
          <div>
            <p className="mb-2 text-[10px] font-medium text-emerald-300/80">후반 (10~18홀)</p>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 9 }).map((_, i) => {
                const holeIdx = i + 9;
                const val = activeScores[holeIdx] ?? 0;
                const holePar = par[holeIdx];
                const colorClass = getScoreColor(val);
                const label = getScoreLabel(val, holePar);
                return (
                  <div
                    key={holeIdx}
                    className={`rounded-xl border p-2 text-center ${colorClass}`}
                  >
                    <p className="text-[9px] font-medium opacity-75">
                      {holeIdx + 1}홀 · P{holePar}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold">{label}</p>
                    <p className="text-[11px] font-bold">{holePar + val}</p>
                    <div className="mt-1.5 flex justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustScore(activeMemberIndex, holeIdx, -1)}
                        className="h-7 w-7 rounded-lg bg-black/20 text-sm font-bold leading-none hover:bg-black/40 active:scale-95"
                        aria-label={`${holeIdx + 1}홀 타수 줄이기`}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustScore(activeMemberIndex, holeIdx, 1)}
                        className="h-7 w-7 rounded-lg bg-black/20 text-sm font-bold leading-none hover:bg-black/40 active:scale-95"
                        aria-label={`${holeIdx + 1}홀 타수 늘리기`}
                      >
                        ＋
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 폼 전송용 hidden inputs */}
      {members.map((_, memberIdx) =>
        Array.from({ length: 18 }).map((_, holeIdx) => (
          <input
            key={`h${holeIdx}-${memberIdx}`}
            type="hidden"
            name={`h${holeIdx + 1}_${memberIdx}`}
            value={effectiveScores[memberIdx]?.[holeIdx] ?? 0}
            readOnly
          />
        )),
      )}

      {/* 요약 테이블 */}
      <div className="overflow-auto rounded-2xl border border-emerald-800/70 bg-emerald-950/80">
        <table className="min-w-full border-collapse text-center text-[11px] text-emerald-50">
          <thead className="bg-emerald-900/90">
            <tr>
              <th className="px-2 py-2 text-left text-[11px] font-medium text-emerald-100/90">홀 / PAR</th>
              {members.map((m) => (
                <th key={m.id} className="px-2 py-2 text-[11px] font-medium text-emerald-100/90">
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 18 }).map((_, holeIdx) => (
              <tr
                key={holeIdx}
                className={holeIdx % 2 === 0 ? "bg-emerald-950/60" : "bg-emerald-900/60"}
              >
                <td className="px-2 py-1.5 text-left text-[11px] text-emerald-100">
                  <span>{holeIdx + 1}홀</span>
                  {coursePar && (
                    <span className="ml-1 text-[11px] text-emerald-300/90">P{par[holeIdx]}</span>
                  )}
                </td>
                {members.map((_, memberIdx) => {
                  const val = effectiveScores[memberIdx]?.[holeIdx] ?? 0;
                  const actual = par[holeIdx] + val;
                  let cellClass = "text-emerald-50";
                  if (val <= -2) cellClass = "text-purple-300 font-semibold";
                  else if (val === -1) cellClass = "text-blue-300 font-semibold";
                  else if (val === 1) cellClass = "text-yellow-300";
                  else if (val === 2) cellClass = "text-orange-300";
                  else if (val >= 3) cellClass = "text-red-300";
                  return (
                    <td key={memberIdx} className={`px-2 py-1.5 text-center text-xs ${cellClass}`}>
                      {val === 0 ? "−" : actual}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-emerald-900/95">
              <td className="px-2 py-2 text-left text-[11px] font-semibold text-emerald-50">총점</td>
              {members.map((m, idx) => (
                <td key={m.id} className="px-2 py-2 text-center text-[11px] font-semibold text-emerald-50">
                  {totalsByMember[idx]}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
