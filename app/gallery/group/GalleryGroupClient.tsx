"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

export type GalleryItem = {
  id: number;
  title: string;
  description: string | null;
  tags: string;
  filePath: string;
  imageUrl: string;
  groupId: string | null;
  isCover: boolean;
  createdAt: string;
};

export function GalleryGroupClient({ items }: { items: GalleryItem[] }) {
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [list, setList] = useState<GalleryItem[]>(items);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingTagsId, setEditingTagsId] = useState<number | null>(null);
  const [editingTagsValue, setEditingTagsValue] = useState("");

  useEffect(() => {
    if (list.length === 0) router.replace("/gallery");
  }, [list.length, router]);

  const current =
    lightboxIndex !== null ? list[lightboxIndex] ?? null : null;

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? list.length - 1 : lightboxIndex - 1);
  }, [lightboxIndex, list.length]);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === list.length - 1 ? 0 : lightboxIndex + 1);
  }, [lightboxIndex, list.length]);

  const handleDelete = async (e: React.MouseEvent, itemId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId !== null) return;
    setDeletingId(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/gallery/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "삭제 실패");
      }
      setList((prev) => prev.filter((i) => i.id !== itemId));
      if (current?.id === itemId) {
        const deletedIndex = list.findIndex((i) => i.id === itemId);
        if (list.length <= 1) setLightboxIndex(null);
        else {
          const nextIndex =
            deletedIndex >= list.length - 1
              ? Math.max(0, list.length - 2)
              : deletedIndex;
          setLightboxIndex(nextIndex);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 중 오류");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveTags = async (itemId: number, newTags: string) => {
    try {
      const res = await fetch(`/api/gallery/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });
      if (!res.ok) throw new Error("저장 실패");
      const data = (await res.json()) as GalleryItem;
      setList((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, tags: data.tags } : i)),
      );
      setEditingTagsId(null);
    } catch {
      setError("태그 저장에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-2 gap-3">
        {list.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="w-full rounded-2xl border border-emerald-800/70 overflow-hidden bg-emerald-950/80 shadow-md hover:border-emerald-600/80 transition text-left"
            >
              <div className="aspect-square relative bg-emerald-900/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover bg-emerald-900/80"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) (fallback as HTMLElement).style.display = "flex";
                  }}
                />
                <div
                  className="absolute inset-0 hidden items-center justify-center bg-emerald-900/80 text-[11px] text-emerald-300/80"
                  style={{ display: "none" }}
                  aria-hidden
                >
                  이미지를 불러올 수 없습니다
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold text-emerald-50 truncate">
                  {item.title}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p className="text-[11px] text-red-300">{error}</p>
      )}

      {/* Lightbox */}
      {current && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="사진 크게 보기"
        >
          <button
            type="button"
            className="absolute inset-0 z-0"
            onClick={() => setLightboxIndex(null)}
            aria-label="닫기"
          />
          <div className="flex-1 flex items-center justify-center min-h-0 p-4 relative z-10 pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.imageUrl}
              alt={current.title}
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          </div>
          <div className="flex-shrink-0 px-4 pb-6 pt-2 text-center relative z-10">
            <p className="text-sm font-semibold text-white">{current.title}</p>
            {current.description && (
              <p className="mt-1 text-[11px] text-white/80">
                {current.description}
              </p>
            )}
            {editingTagsId === current.id ? (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <input
                  type="text"
                  value={editingTagsValue}
                  onChange={(e) => setEditingTagsValue(e.target.value)}
                  placeholder="쉼표로 구분"
                  className="rounded-lg border border-white/30 bg-black/50 px-2 py-1.5 text-xs text-white placeholder:text-white/50 w-48 max-w-full"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveTags(current.id, editingTagsValue)}
                  className="rounded-lg bg-emerald-600 px-2 py-1.5 text-[11px] font-medium text-white"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTagsId(null);
                    setEditingTagsValue("");
                  }}
                  className="rounded-lg bg-white/20 px-2 py-1.5 text-[11px] text-white"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {current.tags
                  ? current.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-white/20 px-2 py-0.5 text-[10px] text-white/90"
                        >
                          {tag}
                        </span>
                      ))
                  : null}
                <button
                  type="button"
                  onClick={() => {
                    setEditingTagsId(current.id);
                    setEditingTagsValue(current.tags || "");
                  }}
                  className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/70 hover:bg-white/20"
                >
                  태그 편집
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => current && handleDelete(e, current.id)}
            disabled={current ? deletingId === current.id : true}
            className="absolute top-3 left-3 z-20 rounded-full bg-red-600/80 p-2.5 text-white hover:bg-red-500 disabled:opacity-50"
            aria-label="사진 삭제"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-3 right-3 z-20 rounded-full bg-white/20 p-2.5 text-white hover:bg-white/30"
            aria-label="닫기"
          >
            <svg
              className="w-6 h-6"
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
          {list.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                aria-label="이전"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                aria-label="다음"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <p className="absolute bottom-14 left-0 right-0 z-20 text-center text-[11px] text-white/60">
                {lightboxIndex! + 1} / {list.length}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
