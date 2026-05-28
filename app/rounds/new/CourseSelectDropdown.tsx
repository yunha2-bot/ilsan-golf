"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { CoursePar } from "@/app/actions/courses";
import { createCourse, deleteCourse, updateCourseName } from "@/app/actions/courses";

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
  const [selectOpen, setSelectOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [parIn, setParIn] = useState<number[]>(() => Array(9).fill(DEFAULT_PAR));
  const [parOut, setParOut] = useState<number[]>(() => Array(9).fill(DEFAULT_PAR));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestMsg, setSuggestMsg] = useState("");
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");

  const selectRef = useRef<HTMLDivElement>(null);
  const selectedCourse = courses.find((c) => c.name === selectedValue) ?? null;
  useEffect(() => {
    onSelectionChange?.(courses.find((c) => c.name === selectedValue) ?? null);
  }, [selectedValue, courses]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setSelectOpen(false);
      }
    };
    if (selectOpen) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [selectOpen]);
  // 서버 목록과 동기화하되, 이번 세션에서 추가한 코스(아직 서버 목록에 없을 수 있음)는 유지
  useEffect(() => {
    setCourses((prev) => {
      const serverIds = new Set(initialCourses.map((c) => c.id));
      const addedThisSession = prev.filter((c) => !serverIds.has(c.id));
      const merged = [...initialCourses, ...addedThisSession];
      return merged.length > 0
        ? [...merged].sort((a, b) => a.name.localeCompare(b.name))
        : initialCourses;
    });
  }, [initialCourses]);

  const handleSelectValue = (v: string) => {
    if (v === NEW_COURSE_VALUE) {
      setModalOpen(true);
      setNewName("");
      setParIn(Array(9).fill(DEFAULT_PAR));
      setParOut(Array(9).fill(DEFAULT_PAR));
      setError("");
      setSuggestMsg("");
      setSelectOpen(false);
    } else {
      setSelectedValue(v);
      const c = courses.find((x) => x.name === v) ?? null;
      onSelectionChange?.(c);
      setSelectOpen(false);
    }
  };

  const handleSuggestPar = async () => {
    if (!newName.trim()) {
      setSuggestMsg("골프장 이름을 먼저 입력해 주세요.");
      return;
    }
    setSuggesting(true);
    setSuggestMsg("");
    try {
      const res = await fetch("/api/course-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (data.par && Array.isArray(data.par) && data.par.length === 18) {
        setParIn(data.par.slice(0, 9));
        setParOut(data.par.slice(9, 18));
        setSuggestMsg(`✓ "${data.matched}" 데이터를 불러왔습니다. 확인 후 저장하세요.`);
      } else {
        setSuggestMsg(data.message ?? "데이터를 찾을 수 없습니다. 직접 입력해 주세요.");
      }
    } catch {
      setSuggestMsg("불러오기 실패. 직접 입력해 주세요.");
    } finally {
      setSuggesting(false);
    }
  };

  const PAR_OPTIONS = [3, 4, 5] as const;

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
      // 서버에서 코스 목록 다시 불러와서 드롭다운에 새 코스가 확실히 반영되도록
      router.refresh();
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

  const startEditCourse = (c: CoursePar) => {
    setEditingCourseId(c.id);
    setEditName(c.name);
    setEditError("");
  };

  const cancelEditCourse = () => {
    setEditingCourseId(null);
    setEditName("");
    setEditError("");
  };

  const handleSaveCourseName = async () => {
    if (editingCourseId == null) return;
    setEditError("");
    const name = editName.trim();
    if (!name) {
      setEditError("코스 이름을 입력해 주세요.");
      return;
    }
    const result = await updateCourseName(editingCourseId, name);
    if (result.ok) {
      const nextCourses = courses
        .map((c) => (c.id === result.course.id ? result.course : c))
        .sort((a, b) => a.name.localeCompare(b.name));
      setCourses(nextCourses);
      if (selectedValue === courses.find((c) => c.id === editingCourseId)?.name) {
        setSelectedValue(result.course.name);
        onSelectionChange?.(result.course);
      }
      onCoursesChange?.(nextCourses);
      cancelEditCourse();
      router.refresh();
    } else {
      setEditError(result.error ?? "수정 실패");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-1" ref={selectRef}>
        <button
          type="button"
          onClick={() => setListModalOpen(true)}
          className="text-[11px] font-medium text-emerald-100/90 text-left hover:text-emerald-50 hover:underline"
        >
          코스(경기장)
        </button>
        <input type="hidden" name="course" value={selectedValue} />
        <div className="relative">
          <button
            type="button"
            id="course-select"
            onClick={() => setSelectOpen((o) => !o)}
            className="w-full rounded-lg border border-emerald-800/70 bg-emerald-950/90 px-3 py-2.5 text-left text-xs text-emerald-50 outline-none focus:border-emerald-400 [color-scheme:dark]"
          >
            {selectedValue || "선택하세요"}
          </button>
          {selectOpen && (
            <ul
              className="absolute left-0 right-0 top-full z-10 mt-1 max-h-[12rem] overflow-y-auto overflow-x-hidden rounded-lg border border-emerald-700/80 bg-emerald-950 py-1 shadow-xl"
              role="listbox"
              aria-label="코스 선택"
            >
              {courses.map((c) => (
                <li key={c.id} role="option">
                  <button
                    type="button"
                    onClick={() => handleSelectValue(c.name)}
                    className="w-full px-3 py-2.5 text-left text-xs text-emerald-50 hover:bg-emerald-800/80"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
              <li role="option">
                <button
                  type="button"
                  onClick={() => handleSelectValue(NEW_COURSE_VALUE)}
                  className="w-full px-3 py-2.5 text-left text-xs text-emerald-300 hover:bg-emerald-800/80"
                >
                  ➕ 새 코스 추가
                </button>
              </li>
            </ul>
          )}
        </div>
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
            <p className="mt-1 text-[11px] text-emerald-200/85">
              수정 시 이름을 변경할 수 있습니다. 삭제 시 목록에서만 제거되며, 이미 기록된 라운드는 그대로 유지됩니다.
            </p>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {courses.length === 0 ? (
                <li className="py-4 text-center text-[11px] text-emerald-300/80">
                  등록된 경기장이 없습니다.
                </li>
              ) : (
                courses.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-emerald-800/70 bg-emerald-900/50 px-3 py-2"
                  >
                    {editingCourseId === c.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="코스 이름"
                          className="w-full rounded-lg border border-emerald-700/80 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-50 outline-none focus:border-emerald-400"
                          autoFocus
                        />
                        {editError && <p className="text-[11px] text-red-400">{editError}</p>}
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={handleSaveCourseName}
                            className="flex-1 rounded-lg border border-emerald-600 bg-emerald-600 py-1.5 text-[11px] font-medium text-emerald-950"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditCourse}
                            className="flex-1 rounded-lg border border-emerald-700 bg-emerald-800/80 py-1.5 text-[11px] font-medium text-emerald-100"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 flex-1 truncate text-xs text-emerald-50">{c.name}</span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEditCourse(c)}
                            className="rounded-lg border border-emerald-600 bg-emerald-700/80 px-2.5 py-1.5 text-[11px] font-medium text-emerald-50 hover:bg-emerald-600/90"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c.id, c.name)}
                            className="rounded-lg border border-red-800/80 bg-red-950/80 px-2.5 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-900/80"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    )}
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

      {modalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="새 코스 추가"
          >
            <div className="w-full max-w-sm rounded-2xl border border-emerald-700/80 bg-emerald-950 p-4 shadow-2xl">
              <p className="text-sm font-semibold text-emerald-50">새 코스 추가</p>
              <p className="mt-1 text-[11px] text-emerald-200/85">
                코스 이름과 전반·후반 홀별 파를 입력한 뒤 저장하세요.
              </p>
              <form onSubmit={handleAddCourse} className="mt-4 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-emerald-100/90">코스 이름</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => { setNewName(e.target.value); setSuggestMsg(""); }}
                      placeholder="예: 남서울CC"
                      className="flex-1 rounded-lg border border-emerald-700/80 bg-emerald-900/90 px-3 py-2.5 text-xs text-emerald-50 outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={handleSuggestPar}
                      disabled={suggesting}
                      className="shrink-0 rounded-lg border border-emerald-500 bg-emerald-700/80 px-3 py-2.5 text-[11px] font-medium text-emerald-100 hover:bg-emerald-600/90 disabled:opacity-50"
                    >
                      {suggesting ? "검색 중…" : "파 자동완성"}
                    </button>
                  </div>
                  {suggestMsg && (
                    <p className={`text-[11px] ${suggestMsg.startsWith("✓") ? "text-emerald-400" : "text-amber-400"}`}>
                      {suggestMsg}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-medium text-emerald-100/90">전반 (1~9홀)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parIn.map((p, i) => (
                        <label key={i} className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-emerald-400/80">{i + 1}</span>
                          <select
                            value={p}
                            onChange={(e) => handleParChange("in", i, e.target.value)}
                            className="min-w-[3.25rem] rounded border border-emerald-700/80 bg-emerald-900/90 px-2 py-2 text-center text-xs text-emerald-50 [color-scheme:dark]"
                            aria-label={`${i + 1}홀 파`}
                          >
                            {PAR_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-medium text-emerald-100/90">후반 (10~18홀)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parOut.map((p, i) => (
                        <label key={i} className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-emerald-400/80">{i + 10}</span>
                          <select
                            value={p}
                            onChange={(e) => handleParChange("out", i, e.target.value)}
                            className="min-w-[3.25rem] rounded border border-emerald-700/80 bg-emerald-900/90 px-2 py-2 text-center text-xs text-emerald-50 [color-scheme:dark]"
                            aria-label={`${i + 10}홀 파`}
                          >
                            {PAR_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
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
          </div>,
          document.body,
        )}
    </>
  );
}
