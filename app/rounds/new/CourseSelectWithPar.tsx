"use client";

import { useState, useMemo } from "react";

export type CourseOption = { id: number; name: string };

const DEFAULT_PAR = 4;

export function CourseSelectWithPar({
  courses,
  defaultValue = "",
}: {
  courses: CourseOption[];
  defaultValue?: string;
}) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [parIn, setParIn] = useState<number[]>(() => Array(9).fill(DEFAULT_PAR));
  const [parOut, setParOut] = useState<number[]>(() => Array(9).fill(DEFAULT_PAR));

  const selectedExisting = courses.find(
    (c) => c.name.toLowerCase() === inputValue.trim().toLowerCase(),
  );
  const isNewCourse =
    inputValue.trim() !== "" && !selectedExisting;

  const filtered = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return courses.slice(0, 20);
    return courses
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [courses, inputValue]);

  const handleParChange = (
    section: "in" | "out",
    index: number,
    value: string,
  ) => {
    const n = parseInt(value, 10);
    const v = Number.isFinite(n) && n >= 3 && n <= 5 ? n : DEFAULT_PAR;
    if (section === "in") {
      setParIn((prev) => {
        const next = [...prev];
        next[index] = v;
        return next;
      });
    } else {
      setParOut((prev) => {
        const next = [...prev];
        next[index] = v;
        return next;
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="course" className="text-[11px] text-emerald-100/85">
          코스(경기장)
        </label>
        <div className="relative">
          <input
            id="course"
            name="course"
            type="text"
            list="course-list"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="검색하거나 새 코스 이름 입력"
            className="w-full rounded-lg border border-emerald-800/70 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-50 outline-none placeholder:text-emerald-400/60 focus:border-emerald-400"
            autoComplete="off"
          />
          <datalist id="course-list">
            {filtered.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        {inputValue.trim() && (
          <p className="text-[10px] text-emerald-200/80">
            {selectedExisting
              ? `기존 코스 선택: ${selectedExisting.name}`
              : "새 코스로 추가됩니다. 아래에서 전반/후반 파를 입력해 주세요."}
          </p>
        )}
      </div>

      {isNewCourse && (
        <div className="rounded-xl border border-emerald-700/70 bg-emerald-950/80 px-3 py-3">
          <p className="text-[11px] font-medium text-emerald-200/90 mb-2">
            홀별 파 입력 (새 코스)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-emerald-300/80 mb-1.5">
                전반 (1~9홀)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parIn.map((p, i) => (
                  <label key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-emerald-400/80">
                      {i + 1}
                    </span>
                    <input
                      type="number"
                      name={`par${i + 1}`}
                      min={3}
                      max={5}
                      value={p}
                      onChange={(e) =>
                        handleParChange("in", i, e.target.value)
                      }
                      className="w-9 rounded border border-emerald-700/80 bg-emerald-900/90 px-1 py-1 text-center text-[11px] text-emerald-50 [color-scheme:dark]"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-emerald-300/80 mb-1.5">
                후반 (10~18홀)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parOut.map((p, i) => (
                  <label key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-emerald-400/80">
                      {i + 10}
                    </span>
                    <input
                      type="number"
                      name={`par${i + 10}`}
                      min={3}
                      max={5}
                      value={p}
                      onChange={(e) =>
                        handleParChange("out", i, e.target.value)
                      }
                      className="w-9 rounded border border-emerald-700/80 bg-emerald-900/90 px-1 py-1 text-center text-[11px] text-emerald-50 [color-scheme:dark]"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
