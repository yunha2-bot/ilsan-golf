"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MemberStatsChartData } from "./MemberStatsCharts";
import { MemberStatsCharts } from "./MemberStatsCharts";

export function MemberStatsBottomSheet({
  memberId,
  onClose,
}: {
  memberId: number | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<MemberStatsChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memberId == null) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/stats/members/${memberId}`)
      .then((res) => {
        if (!res.ok) throw new Error("불러오기 실패");
        return res.json();
      })
      .then((json) => {
        setData(json as MemberStatsChartData);
      })
      .catch(() => setError("데이터를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [memberId]);

  if (memberId == null) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed left-0 right-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl border-t border-emerald-800/80 bg-emerald-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="멤버 스코어 그래프"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-emerald-800/60 bg-emerald-950/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="h-1 w-10 rounded-full bg-emerald-600/60" />
            <span className="text-xs font-medium text-emerald-200/80">
              아래로 당겨 닫기
            </span>
          </div>
          <Link
            href={memberId ? `/stats/members/${memberId}` : "/stats"}
            className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
          >
            전체 화면
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-emerald-200 hover:bg-emerald-800/80 hover:text-emerald-50"
            aria-label="닫기"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pb-8 pt-2 max-h-[calc(85vh-52px)]">
          {loading && (
            <p className="py-12 text-center text-[11px] text-emerald-300/80">
              불러오는 중…
            </p>
          )}
          {error && (
            <p className="py-12 text-center text-[11px] text-red-400">
              {error}
            </p>
          )}
          {!loading && !error && data && <MemberStatsCharts data={data} />}
        </div>
      </div>
    </>
  );
}
