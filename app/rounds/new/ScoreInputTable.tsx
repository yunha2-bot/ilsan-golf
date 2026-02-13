"use client";

import { useMemo, useState, useCallback } from "react";

const PAR_OFFSET = 72;

type ScoresMatrix = number[][];

export type MemberOption = { id: number; name: string };

function defaultScores(len: number): ScoresMatrix {
  return Array.from({ length: len }, () =>
    Array.from({ length: 18 }, () => 0),
  );
}

/** 18개 숫자 배열 → 한 줄 문자열 (0=파, 1~9=+1~+9, -1=b, -2=e) */
function scoresToLine(row: number[]): string {
  return row
    .slice(0, 18)
    .map((v) => {
      if (v === -1) return "b";
      if (v === -2) return "e";
      if (v >= 0 && v <= 9) return String(v);
      return "0";
    })
    .join("");
}

/** 한 줄 문자열 → 18개 숫자 배열. 0-9 그대로, b/B=-1, e/E=-2 */
function lineToScores(line: string): number[] {
  const cleaned = line.replace(/\s/g, "").toLowerCase();
  const out: number[] = [];
  for (let i = 0; i < 18; i++) {
    const c = cleaned[i];
    if (c === "b") out.push(-1);
    else if (c === "e") out.push(-2);
    else if (c >= "0" && c <= "9") out.push(Number(c));
    else out.push(0);
  }
  return out;
}

type Props = {
  members: MemberOption[];
  initialScores?: ScoresMatrix;
  coursePar?: number[];
};

export function ScoreInputTable({ members, initialScores, coursePar }: Props) {
  const len = members.length;
  const [scores, setScores] = useState<ScoresMatrix>(
    () => initialScores ?? defaultScores(len),
  );
  const [activeMemberIndex, setActiveMemberIndex] = useState<number | null>(null);
  /** 입력창에 보여줄 문자열(드래프트). 멤버 전환 시 scores와 동기화 */
  const [lineDraft, setLineDraft] = useState("");

  const parTotal = coursePar?.reduce((a, b) => a + b, 0) ?? PAR_OFFSET;

  const totalsByMember = useMemo(
    () =>
      scores.map((row) => {
        const sum = row.reduce(
          (s, v) => s + (Number.isFinite(v) ? v : 0),
          0,
        );
        return parTotal + sum;
      }),
    [scores, parTotal],
  );

  const setActiveLine = useCallback(
    (line: string) => {
      if (activeMemberIndex === null) return;
      const next = scores.map((row) => [...row]);
      next[activeMemberIndex] = lineToScores(line);
      setScores(next);
    },
    [activeMemberIndex, scores],
  );

  const handleMemberClick = useCallback(
    (idx: number) => {
      setActiveMemberIndex(idx);
      setLineDraft(scoresToLine(scores[idx] ?? []));
    },
    [scores],
  );

  const handleLineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/\s/g, "").replace(/[^0-9be]/gi, "");
    const slice = cleaned.slice(0, 18);
    setLineDraft(slice);
    setActiveLine(slice);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-emerald-200/85">
          멤버를 클릭한 뒤, 아래 입력창에 1홀~18홀 순서로 숫자만 입력하세요.
        </span>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m, idx) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleMemberClick(idx)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                activeMemberIndex === idx
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-emerald-950/70 text-emerald-100/85 border border-emerald-700/70"
              }`}
            >
              {m.name}
              {totalsByMember[idx] !== parTotal && (
                <span className="ml-1 opacity-80">
                  {totalsByMember[idx]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeMemberIndex !== null && (
        <div className="rounded-2xl border border-emerald-800/70 bg-emerald-950/80 p-3">
          <p className="text-sm font-semibold text-emerald-50">
            {members[activeMemberIndex].name}
          </p>
          <p className="mt-1 text-[11px] text-emerald-200/85">
            1홀→18홀 순서로 입력 (0=파, 1~9=+1~+9, b=버디 -1, e=이글 -2)
          </p>
          <input
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoComplete="off"
            value={lineDraft}
            onChange={handleLineChange}
            placeholder="예: 322312210223002201"
            maxLength={18}
            className="mt-2 w-full rounded-lg border border-emerald-600/80 bg-emerald-950/90 px-3 py-2.5 font-mono text-xs tracking-widest text-emerald-50 placeholder:text-emerald-400/50 focus:border-emerald-400 focus:outline-none"
          />
          <p className="mt-1.5 text-[11px] text-emerald-300/80">
            {lineDraft.length}/18자 · 총점 {totalsByMember[activeMemberIndex]}
          </p>
        </div>
      )}

      {/* 폼 전송용: 모든 멤버×18홀 hidden */}
      {members.map((_, memberIdx) =>
        Array.from({ length: 18 }).map((_, holeIdx) => (
          <input
            key={`h${holeIdx}-${memberIdx}`}
            type="hidden"
            name={`h${holeIdx + 1}_${memberIdx}`}
            value={scores[memberIdx]?.[holeIdx] ?? 0}
            readOnly
          />
        )),
      )}

      <div className="overflow-auto rounded-2xl border border-emerald-800/70 bg-emerald-950/80">
        <table className="min-w-full border-collapse text-center text-[11px] text-emerald-50">
          <thead className="bg-emerald-900/90">
            <tr>
              <th className="px-2 py-2 text-left text-[11px] font-medium text-emerald-100/90">
                홀 / PAR
              </th>
              {members.map((m) => (
                <th
                  key={m.id}
                  className="px-2 py-2 text-[11px] font-medium text-emerald-100/90"
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
                    <span className="ml-1 text-[11px] text-emerald-300/90">
                      PAR {coursePar[holeIdx]}
                    </span>
                  )}
                </td>
                {members.map((_, memberIdx) => {
                  const val = scores[memberIdx]?.[holeIdx] ?? 0;
                  return (
                    <td
                      key={memberIdx}
                      className="px-2 py-1.5 text-center text-xs text-emerald-50"
                    >
                      {val === 0 ? "−" : val}
                    </td>
                  );
                })}
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
                  className="px-2 py-2 text-center text-[11px] font-semibold text-emerald-50"
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
