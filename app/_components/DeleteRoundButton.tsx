"use client";

import { useState, useTransition } from "react";
import { deleteRoundWithPassword } from "@/app/actions/rounds";

export function DeleteRoundButton({ roundId }: { roundId: number }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setPassword("");
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await deleteRoundWithPassword(roundId, password);
      if (!result.ok) {
        setError(result.error ?? "비밀번호가 올바르지 않습니다.");
        return;
      }
      setModalOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={isPending}
        className="text-[11px] font-medium text-red-300 hover:text-red-200 disabled:opacity-50"
      >
        삭제
      </button>
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="라운드 삭제 확인"
        >
          <div className="w-full max-w-sm rounded-2xl border border-emerald-800/80 bg-emerald-950 p-4 shadow-xl">
            <p className="text-sm font-semibold text-emerald-50">
              라운드 삭제
            </p>
            <p className="mt-1 text-[11px] text-emerald-200/85">
              삭제하면 스코어가 모두 삭제됩니다. 비밀번호를 입력하세요.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="delete-password" className="sr-only">
                  삭제 비밀번호
                </label>
                <input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full rounded-lg border border-emerald-700/80 bg-emerald-950/90 px-3 py-2.5 text-xs text-emerald-50 placeholder:text-emerald-400/60 focus:border-emerald-400 focus:outline-none"
                  autoFocus
                  disabled={isPending}
                />
              </div>
              {error && (
                <p className="text-[11px] text-red-400">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-emerald-600 bg-emerald-800/80 py-2.5 text-xs font-medium text-emerald-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                >
                  {isPending ? "삭제 중…" : "삭제"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
