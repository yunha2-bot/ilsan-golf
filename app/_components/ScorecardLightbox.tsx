"use client";

import { useState } from "react";

/**
 * 스코어카드 버튼 + 클릭 시 같은 페이지에서 라이트박스로 사진 표시.
 * 닫기 버튼으로 되돌아갈 수 있음.
 */
export function ScorecardButton({ imageUrl }: { imageUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] font-medium text-emerald-300/90 hover:text-emerald-200"
      >
        스코어카드
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="스코어카드 보기"
        >
          <button
            type="button"
            className="absolute inset-0 z-0"
            onClick={() => setOpen(false)}
            aria-label="닫기"
          />
          <div className="flex-1 flex items-center justify-center min-h-0 p-4 relative z-10 pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="스코어카드"
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          </div>
          <div className="relative z-20 flex justify-center pb-6 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
