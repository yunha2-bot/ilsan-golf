"use client";

import { useTransition } from "react";
import { deleteRound } from "@/app/actions/rounds";

export function DeleteRoundButton({ roundId }: { roundId: number }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("이 라운드를 삭제할까요? 스코어가 모두 삭제됩니다.")) return;
    startTransition(() => {
      deleteRound(roundId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-[11px] font-medium text-red-300 hover:text-red-200 disabled:opacity-50"
    >
      {isPending ? "삭제 중…" : "삭제"}
    </button>
  );
}
