"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CoursePar } from "@/app/actions/courses";
import { createCourse, deleteCourse } from "@/app/actions/courses";

const NEW_COURSE_VALUE = "__new__";
const DEFAULT_PAR = 4;

type Props = {
  courses: CoursePar[];
  defaultValue?: string;
  onCoursesChange?: (courses: CoursePar[]) => void;
  onSelectionChange?: (course: CoursePar | null) => void;
};

export function CourseSelectDropdown({
  courses: initialCourses,
  defaultValue = "",
  onCoursesChange,
  onSelectionChange,
}: Props) {
  const router = useRouter();
  const [courses, setCourses] = useState<CoursePar[]>(initialCourses);
  const [selectedValue, setSelectedValue] = useState(defaultValue || (initialCourses[0]?.name ?? ""));
  const [modalOpen, setModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [parIn, setParIn] = useState<number[]>(() => Array(9).fill(DEFAULT_PAR));
  const [parOut, setParOut] = useState<number[]>(() => Array(9).fill(DEFAULT_PAR));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const selectedCourse = courses.find((c) => c.name === selectedValue) ?? null;
  useEffect(() => {
    onSelectionChange?.(courses.find((c) => c.name === selectedValue) ?? null);
  }, [selectedValue, courses]);
  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === NEW_COURSE_VALUE) {
      setModalOpen(true);
      setNewName("");
      setParIn(Array(9).fill(DEFAULT_PAR));
      setParOut(Array(9).fill(DEFAULT_PAR));
      setError("");
    } else {
      setSelectedValue(v);
      const c = courses.find((x) => x.name === v) ?? null;
      onSelectionChange?.(c);
    }
  };

  const handleParChange = (section: "in" | "out", index: number, value: string) => {
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

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newName.trim()) {
      setError("코스 이름을 입력해 주세요.");
      return;
    }
    setPending(true);
    const formData = new FormData();
    formData.set("courseName", newName.trim());
    ;[...parIn, ...parOut].forEach((p, i) => formData.set(`par${i + 1}`, String(p)));
    const result = await createCourse(formData);
    setPending(false);
    if (result.ok) {
      setCourses((prev) => [...prev, result.course].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedValue(result.course.name);
      onCoursesChange?.([...courses, result.course].sort((a, b) => a.name.localeCompare(b.name)));
      onSelectionChange?.(result.course);
      setModalOpen(false);
    } else {
      setError(result.error ?? "저장 실패");
    }
  };

  const handleDeleteCourse = async (id: number, name: string) => {
    if (!confirm(`「${name}」을(를) 목록에서 삭제할까요?\n이미 기록된 라운드의 코스 이름은 유지됩니다.`)) return;
    const result = await deleteCourse(id);
    if (result.ok) {
      const nextCourses = courses.filter((c) => c.id !== id);
      setCourses(nextCourses);
      if (selectedValue === name) {
        setSelectedValue(nextCourses[0]?.name ?? "");
      }
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setListModalOpen(true)}
          className="text-[11px] text-emerald-100/85 text-left hover:text-emerald-50 hover:underline"
        >
          코스(경기장)
        </button>
        <select
          id="course-select"
          name="course"
          value={selectedValue}
          onChange={handleSelectChange}
          className="w-full rounded-lg border border-emerald-800/70 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-50 outline-none focus:border-emerald-400 [color-scheme:dark]"
        >
          <option value="">선택하세요</option>
          {courses.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
          <option value={NEW_COURSE_VALUE}>➕ 새 코스 추가</option>
        </select>
      </div>

      {listModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="등록된 경기장 목록"
        >
          <div className="w-full max-w-sm rounded-2xl border border-emerald-700/80 bg-emerald-950 p-4 shadow-2xl">
            <p className="text-sm font-semibold text-emerald-50">등록된 경기장</p>
            <p className="mt-1 text-[11px] text-emerald-200/80">
              삭제 시 목록에서만 제거됩니다. 이미 기록된 라운드는 그대로 유지됩니다.
            </p>
            <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
              {courses.length === 0 ? (
                <li className="py-4 text-center text-[11px] text-emerald-300/80">
                  등록된 경기장이 없습니다.
                </li>
              ) : (
                courses.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-emerald-800/70 bg-emerald-900/50 px-3 py-2"
                  >
                    <span className="text-[12px] text-emerald-50">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(c.id, c.name)}
                      className="rounded-lg border border-red-800/80 bg-red-950/80 px-2 py-1 text-[10px] font-medium text-red-200 hover:bg-red-900/80"
                    >
                      삭제
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setListModalOpen(false)}
                className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-emerald-950"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="새 코스 추가"
        >
          <div className="w-full max-w-sm rounded-2xl border border-emerald-700/80 bg-emerald-950 p-4 shadow-2xl">
            <p className="text-sm font-semibold text-emerald-50">새 코스 추가</p>
            <p className="mt-1 text-[11px] text-emerald-200/80">
              코스 이름과 전반(인코스)·후반(아웃코스) 홀별 파를 입력한 뒤 저장하세요.
            </p>
            <form onSubmit={handleAddCourse} className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] text-emerald-300/90">코스 이름</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 남서울 CC"
                  className="mt-1 w-full rounded-lg border border-emerald-700/80 bg-emerald-900/90 px-3 py-2 text-sm text-emerald-50 outline-none focus:border-emerald-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-emerald-300/90 mb-1">전반 · 인코스 (1~9홀)</p>
                  <div className="flex flex-wrap gap-1">
                    {parIn.map((p, i) => (
                      <label key={i} className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] text-emerald-400/80">{i + 1}</span>
                        <input
                          type="number"
                          min={3}
                          max={5}
                          value={p}
                          onChange={(e) => handleParChange("in", i, e.target.value)}
                          className="w-9 rounded border border-emerald-700/80 bg-emerald-900/90 px-1 py-1 text-center text-[11px] text-emerald-50 [color-scheme:dark]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-300/90 mb-1">후반 · 아웃코스 (10~18홀)</p>
                  <div className="flex flex-wrap gap-1">
                    {parOut.map((p, i) => (
                      <label key={i} className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] text-emerald-400/80">{i + 10}</span>
                        <input
                          type="number"
                          min={3}
                          max={5}
                          value={p}
                          onChange={(e) => handleParChange("out", i, e.target.value)}
                          className="w-9 rounded border border-emerald-700/80 bg-emerald-900/90 px-1 py-1 text-center text-[11px] text-emerald-50 [color-scheme:dark]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {error && <p className="text-[11px] text-red-400">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setSelectedValue(courses[0]?.name ?? "");
                  }}
                  className="flex-1 rounded-xl border border-emerald-600 bg-emerald-800/80 py-2 text-xs font-medium text-emerald-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-emerald-950 disabled:opacity-60"
                >
                  {pending ? "저장 중…" : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
