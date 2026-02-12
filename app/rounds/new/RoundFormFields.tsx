"use client";

import { useState } from "react";
import type { CoursePar } from "@/app/actions/courses";
import { CourseSelectDropdown } from "./CourseSelectDropdown";
import { ScoreInputTable } from "./ScoreInputTable";
import type { MemberOption } from "./ScoreInputTable";

type Props = {
  members: MemberOption[];
  courses: CoursePar[];
  defaultRoundDate?: string;
  defaultCourseName?: string;
  defaultNote?: string;
  initialScores?: number[][];
  /** 수정 시: 현재 스코어카드 보기 링크 (있으면 "현재: 등록됨" 문구 + 링크 표시) */
  scorecardViewUrl?: string | null;
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
  scorecardViewUrl,
}: Props) {
  const [selectedCourse, setSelectedCourse] = useState<CoursePar | null>(() => {
    const name = defaultCourseName || courses[0]?.name;
    return courses.find((c) => c.name === name) ?? courses[0] ?? null;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 text-[11px] text-emerald-50">
        <div className="flex flex-col gap-1">
          <label htmlFor="roundDate" className="text-[11px] font-medium text-emerald-100/90">
            라운드 날짜
          </label>
          <input
            id="roundDate"
            name="roundDate"
            type="date"
            defaultValue={defaultRoundDate}
            className="rounded-lg border border-emerald-800/70 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-50 outline-none focus:border-emerald-400 [color-scheme:dark]"
          />
        </div>

        <CourseSelectDropdown
          courses={courses}
          defaultValue={defaultCourseName || courses[0]?.name}
          onSelectionChange={setSelectedCourse}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="note" className="text-[11px] font-medium text-emerald-100/90">
            메모 (선택)
          </label>
          <textarea
            id="note"
            name="note"
            rows={2}
            defaultValue={defaultNote}
            placeholder="라운드 컨디션, 날씨, 특이사항 등을 기록해 두세요."
            className="resize-none rounded-lg border border-emerald-800/70 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-50 outline-none placeholder:text-emerald-400/60 focus:border-emerald-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="scorecardImage" className="text-[11px] font-medium text-emerald-100/90">
            스코어카드 사진 (선택)
          </label>
          {scorecardViewUrl && (
            <p className="mb-1 text-[10px] text-emerald-300/80">
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
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-200"
            >
              현재 스코어카드 보기 →
            </a>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-3">
        <ScoreInputTable
          members={members}
          initialScores={initialScores}
          coursePar={selectedCourse ? toParArray(selectedCourse) : undefined}
        />
      </div>
    </div>
  );
}
