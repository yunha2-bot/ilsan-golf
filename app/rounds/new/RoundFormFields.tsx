"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { CoursePar } from "@/app/actions/courses";
import { CourseSelectDropdown } from "./CourseSelectDropdown";
import { ScoreInputTable } from "./ScoreInputTable";
import type { MemberOption } from "./ScoreInputTable";

const DRAFT_KEY = "round_draft_v1";

type Props = {
  members: MemberOption[];
  courses: CoursePar[];
  defaultRoundDate?: string;
  defaultCourseName?: string;
  defaultNote?: string;
  initialScores?: number[][];
  initialSelectedMemberIds?: number[];
  scorecardViewUrl?: string | null;
  submitLabel?: string;
};

function toParArray(c: CoursePar): number[] {
  return [
    c.par1, c.par2, c.par3, c.par4, c.par5, c.par6, c.par7, c.par8, c.par9,
    c.par10, c.par11, c.par12, c.par13, c.par14, c.par15, c.par16, c.par17, c.par18,
  ];
}

export function RoundFormFields({
  members,
  courses,
  defaultRoundDate = "",
  defaultCourseName = "",
  defaultNote = "",
  initialScores,
  initialSelectedMemberIds,
  scorecardViewUrl,
  submitLabel = "라운드 저장하기",
}: Props) {
  // 편집 모드(initialScores 있음)에서는 자동저장 비활성화
  const isDraftMode = !initialScores;

  const [draft] = useState<{ date?: string; course?: string; note?: string; memberIds?: number[] } | null>(() => {
    if (!isDraftMode || typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [roundDate, setRoundDate] = useState(draft?.date ?? defaultRoundDate);
  const [note, setNote] = useState(draft?.note ?? defaultNote);
  const [draftRestored, setDraftRestored] = useState(!!draft);

  const [selectedCourse, setSelectedCourse] = useState<CoursePar | null>(() => {
    const name = draft?.course ?? defaultCourseName ?? courses[0]?.name;
    return courses.find((c) => c.name === name) ?? courses[0] ?? null;
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(draft?.memberIds ?? initialSelectedMemberIds ?? members.map((m) => m.id)),
  );

  // 변경될 때마다 localStorage에 저장
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isDraftMode) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          date: roundDate,
          course: selectedCourse?.name ?? "",
          note,
          memberIds: [...selectedIds],
        }));
      } catch {}
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [isDraftMode, roundDate, selectedCourse, note, selectedIds]);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setDraftRestored(false);
  };

  const toggleMember = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.has(id) && prev.size === 1) return prev;
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedMembers = useMemo(
    () => members.filter((m) => selectedIds.has(m.id)),
    [members, selectedIds],
  );

  const selectedInitialScores = useMemo(() => {
    if (!initialScores) return undefined;
    return members
      .map((m, i) => ({ id: m.id, scores: initialScores[i] ?? Array(18).fill(0) }))
      .filter((x) => selectedIds.has(x.id))
      .map((x) => x.scores);
  }, [initialScores, members, selectedIds]);

  return (
    <div className="space-y-4">
      {draftRestored && (
        <div className="flex items-center justify-between rounded-lg border border-amber-700/60 bg-amber-950/50 px-3 py-2 text-[11px]">
          <span className="text-amber-300">이전에 입력하던 내용을 불러왔어요.</span>
          <button type="button" onClick={clearDraft} className="ml-3 text-amber-400/80 hover:text-amber-200 underline shrink-0">
            초기화
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 text-emerald-50">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="roundDate" className="text-[11px] font-medium text-emerald-100/90">
            라운드 날짜
          </label>
          <input
            id="roundDate"
            name="roundDate"
            type="date"
            value={roundDate}
            onChange={(e) => setRoundDate(e.target.value)}
            className="rounded-lg border border-emerald-800/70 bg-emerald-950/90 px-3 py-2.5 text-xs text-emerald-50 outline-none focus:border-emerald-400 [color-scheme:dark]"
          />
        </div>

        <CourseSelectDropdown
          courses={courses}
          defaultValue={selectedCourse?.name ?? defaultCourseName ?? courses[0]?.name}
          onSelectionChange={(c) => { setSelectedCourse(c); }}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-emerald-100/90">
            참여 멤버 선택
          </label>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const selected = selectedIds.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                    selected
                      ? "bg-emerald-500 text-emerald-950"
                      : "bg-emerald-950/70 border border-emerald-700/70 text-emerald-400/70"
                  }`}
                >
                  {selected ? "✓ " : ""}{m.name}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-emerald-400/70">
            이번 라운드에 참여하는 멤버만 선택하세요 (최소 1명)
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="note" className="text-[11px] font-medium text-emerald-100/90">
            메모 (선택)
          </label>
          <textarea
            id="note"
            name="note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="라운드 컨디션, 날씨, 특이사항 등을 기록해 두세요."
            className="resize-none rounded-lg border border-emerald-800/70 bg-emerald-950/90 px-3 py-2.5 text-xs text-emerald-50 outline-none placeholder:text-emerald-400/60 focus:border-emerald-400"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="scorecardImage" className="text-[11px] font-medium text-emerald-100/90">
            스코어카드 사진 (선택)
          </label>
          {scorecardViewUrl && (
            <p className="mt-1 text-[11px] text-emerald-300/80">
              현재: 등록됨 · 새 파일을 선택하면 교체됩니다.
            </p>
          )}
          <input
            id="scorecardImage"
            name="scorecardImage"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="rounded-lg border border-emerald-800/70 bg-emerald-950/90 px-2 py-1.5 text-[11px] text-emerald-50 file:mr-2 file:rounded file:border-0 file:bg-emerald-700/80 file:px-2 file:py-1 file:text-emerald-50"
          />
          {scorecardViewUrl && (
            <a
              href={scorecardViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-200"
            >
              현재 스코어카드 보기 →
            </a>
          )}
        </div>
      </div>

      {/* 선택된 멤버 ID를 폼에 전달 */}
      {selectedMembers.map((m) => (
        <input key={m.id} type="hidden" name="selectedMemberId" value={m.id} />
      ))}

      <div className="mt-2 space-y-3">
        <ScoreInputTable
          members={selectedMembers}
          initialScores={selectedInitialScores}
          coursePar={selectedCourse ? toParArray(selectedCourse) : undefined}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          onClick={isDraftMode ? clearDraft : undefined}
          className="flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-900/80 transition hover:bg-emerald-400"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

