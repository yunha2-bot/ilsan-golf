"use client";

import { useMemo, useState } from "react";

const PAR_OFFSET = 72; // 코스 파 없을 때 총점 표시용

type ScoresMatrix = number[][];

export type MemberOption = { id: number; name: string };

function defaultScores(len: number): ScoresMatrix {
  return Array.from({ length: len }, () =>
    Array.from({ length: 18 }, () => 0),
  );
}

type Props = {
  members: MemberOption[];
  initialScores?: ScoresMatrix;
  /** 홀별 파 (18개). 있으면 1홀 옆에 PAR 표시 및 총점 계산에 반영 */
  coursePar?: number[];
};

export function ScoreInputTable({ members, initialScores, coursePar }: Props) {
  const len = members.length;
  const [scores, setScores] = useState<ScoresMatrix>(
    () => initialScores ?? defaultScores(len),
  );
  const [activeMemberIndex, setActiveMemberIndex] = useState(0);

  const parTotal = coursePar?.reduce((a, b) => a + b, 0) ?? PAR_OFFSET;

  const totalsByMember = useMemo(
    () =>
      scores.map((row) => {
        const parRelativeSum = row.reduce(
          (sum, v) => sum + (Number.isFinite(v) ? v : 0),
          0,
        );
        return parTotal + parRelativeSum;
      }),
    [scores, parTotal],
  );

  const handleScoreChange = (
    memberIndex: number,
    holeIndex: number,
    value: string,
  ) => {
    const trimmed = value.replace(/\s/g, "");
    const isNegative = trimmed.startsWith("-");
    const numStr = trimmed.replace(/[^0-9]/g, "");
    let numeric = parseInt(numStr, 10);
    if (Number.isNaN(numeric)) numeric = 0;
    if (isNegative && (numStr.length > 0 || trimmed === "-")) numeric = -numeric;
    const next = scores.map((row) => [...row]);
    next[memberIndex][holeIndex] = numeric;
    setScores(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-emerald-100/80">
          멤버별 18홀 스코어 (파 대비: -1 버디, 0 파, +1 보기)
        </span>
        <div className="flex gap-1.5">
          {members.map((m, idx) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMemberIndex(idx)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                activeMemberIndex === idx
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-emerald-950/70 text-emerald-100/85 border border-emerald-700/70"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-emerald-800/70 bg-emerald-950/80">
        <table className="min-w-full border-collapse text-center text-[11px] text-emerald-50">
          <thead className="bg-emerald-900/90">
            <tr>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-emerald-100/90">
                홀 / PAR
              </th>
              {members.map((m, idx) => (
                <th
                  key={m.id}
                  className={`px-2 py-2 text-[10px] font-medium ${
                    activeMemberIndex === idx
                      ? "text-emerald-50"
                      : "text-emerald-100/85"
                  }`}
                >
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 18 }).map((_, holeIdx) => (
              <tr
                key={holeIdx}
                className={
                  holeIdx % 2 === 0 ? "bg-emerald-950/60" : "bg-emerald-900/60"
                }
              >
                <td className="px-2 py-1.5 text-left text-[11px] text-emerald-100">
                  <span>{holeIdx + 1}홀</span>
                  {coursePar && (
                    <span className="ml-1 text-[10px] text-emerald-300/90">
                      PAR {coursePar[holeIdx]}
                    </span>
                  )}
                </td>
                {members.map((_, memberIdx) => (
                  <td key={memberIdx} className="px-2 py-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={-5}
                      max={10}
                      name={`h${holeIdx + 1}_${memberIdx}`}
                      value={
                        scores[memberIdx][holeIdx] === 0
                          ? 0
                          : scores[memberIdx][holeIdx] ?? ""
                      }
                      placeholder="0"
                      onChange={(e) =>
                        handleScoreChange(
                          memberIdx,
                          holeIdx,
                          e.target.value,
                        )
                      }
                      className={`w-14 rounded-md border bg-emerald-950/90 px-1.5 py-1 text-center text-[11px] text-emerald-50 outline-none focus:border-emerald-400 ${
                        activeMemberIndex === memberIdx
                          ? "border-emerald-500/80"
                          : "border-emerald-700/80"
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-emerald-900/95">
                <td className="px-2 py-2 text-left text-[11px] font-semibold text-emerald-50">
                총점
              </td>
              {members.map((m, idx) => (
                <td
                  key={m.id}
                  className="px-2 py-2 text-center text-xs font-semibold text-emerald-50"
                >
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

