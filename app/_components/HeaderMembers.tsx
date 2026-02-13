"use client";

import { useState } from "react";
import { updateMemberName } from "@/app/actions/members";

type Member = { id: number; name: string };

export function HeaderMembers({ members }: { members: Member[] }) {
  const [editing, setEditing] = useState<Member | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const openEdit = (m: Member) => {
    setEditing(m);
    setValue(m.name);
    setError(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    const res = await updateMemberName(editing.id, value);
    if (res.ok) {
      closeEdit();
    } else {
      setError(res.error ?? "저장 실패");
    }
  };

  if (members.length === 0) {
    return (
      <p className="mt-1 text-xs text-emerald-100/80">
        김동원 · 김상우 · 이문림 · 신윤하
      </p>
    );
  }

  return (
    <>
      <p className="mt-1 text-xs text-emerald-100/80">
        {members.map((m, i) => (
          <span key={m.id}>
            <button
              type="button"
              onClick={() => openEdit(m)}
              className="hover:text-emerald-50 hover:underline focus:outline-none focus:underline"
            >
              {m.name}
            </button>
            {i < members.length - 1 && " · "}
          </span>
        ))}
      </p>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="이름 변경"
        >
          <div className="w-full max-w-sm rounded-2xl border border-emerald-800/80 bg-emerald-950 p-4 shadow-xl">
            <p className="text-sm font-semibold text-emerald-50">이름 변경</p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-lg border border-emerald-700/80 bg-emerald-950/90 px-3 py-2.5 text-xs text-emerald-50 outline-none focus:border-emerald-400"
                placeholder="이름"
                autoFocus
              />
              {error && (
                <p className="text-[11px] text-red-300">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 rounded-lg border border-emerald-700/80 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-900/80"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-emerald-950 hover:bg-emerald-500"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
