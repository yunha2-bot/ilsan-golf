"use client";

import { useState, useCallback } from "react";

export type GalleryItem = {
  id: number;
  title: string;
  description: string | null;
  tags: string;
  filePath: string;
  imageUrl: string;
  createdAt: string;
};

export function GalleryClient({
  items: initialItems,
}: {
  items: GalleryItem[];
}) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingTagsId, setEditingTagsId] = useState<number | null>(null);
  const [editingTagsValue, setEditingTagsValue] = useState("");

  const allTags = Array.from(
    new Set(
      items.flatMap((i) =>
        i.tags ? i.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      ),
    ),
  ).sort();
  const filteredItems = selectedTag
    ? items.filter((item) =>
        item.tags
          .split(",")
          .map((t) => t.trim())
          .includes(selectedTag),
      )
    : items;

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex === 0 ? filteredItems.length - 1 : lightboxIndex - 1,
    );
  }, [lightboxIndex, filteredItems.length]);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex === filteredItems.length - 1 ? 0 : lightboxIndex + 1,
    );
  }, [lightboxIndex, filteredItems.length]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = (fd.get("title") as string)?.trim() || "제목 없음";
    const description = (fd.get("description") as string)?.trim() || null;
    const tagsRaw = (fd.get("tags") as string)?.trim() || "";
    const tags = tagsRaw
      ? tagsRaw
          .split(/[,，\s]+/)
          .map((t) => t.trim())
          .filter(Boolean)
          .join(",")
      : "";
    const fileInput = form.querySelector<HTMLInputElement>('input[name="file"]');
    const files = fileInput?.files ? Array.from(fileInput.files) : [];
    const validFiles = files.filter((f) => f?.size && f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      setUploadError("이미지를 한 장 이상 선택해 주세요.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    let uploaded: GalleryItem[] = [];
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const body = new FormData();
        body.set("title", title);
        if (description) body.set("description", description);
        body.set("tags", tags);
        body.set("file", validFiles[i]);
        const res = await fetch("/api/gallery/upload", {
          method: "POST",
          body,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || "업로드 실패");
        }
        const data = (await res.json()) as GalleryItem & { imageUrl: string };
        uploaded.push({
          id: data.id,
          title: data.title,
          description: data.description ?? null,
          tags: (data as GalleryItem).tags ?? "",
          filePath: data.filePath,
          imageUrl: data.imageUrl,
          createdAt: data.createdAt,
        });
      }
      setItems((prev) => [...uploaded, ...prev]);
      form.reset();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "업로드 중 오류");
      if (uploaded.length > 0) {
        setItems((prev) => [...uploaded, ...prev]);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, itemId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId !== null) return;
    setDeletingId(itemId);
    try {
      const res = await fetch(`/api/gallery/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "삭제 실패");
      }
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      if (current?.id === itemId) setLightboxIndex(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "삭제 중 오류");
    } finally {
      setDeletingId(null);
    }
  };

  const current =
    lightboxIndex !== null ? filteredItems[lightboxIndex] ?? null : null;

  const handleSaveTags = async (itemId: number, newTags: string) => {
    try {
      const res = await fetch(`/api/gallery/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });
      if (!res.ok) throw new Error("저장 실패");
      const data = (await res.json()) as GalleryItem;
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, tags: data.tags }
            : i,
        ),
      );
      setEditingTagsId(null);
    } catch {
      setUploadError("태그 저장에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
        <p className="text-sm font-semibold text-emerald-50">
          라운드 갤러리
        </p>
        <p className="mt-1 text-[11px] text-emerald-200/85">
          사진을 올리고 제목·내용을 적을 수 있습니다. 썸네일을 누르면 크게 보기(슬라이드)가 열립니다.
        </p>
      </section>

      <form
        onSubmit={handleUpload}
        className="rounded-2xl border border-emerald-800/70 bg-emerald-950/50 px-4 py-3 space-y-4"
      >
        <p className="text-sm font-semibold text-emerald-50">새 사진 올리기</p>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-emerald-100/90">제목</label>
          <input
            name="title"
            type="text"
            placeholder="예: 1홀 티샷"
            className="w-full rounded-lg border border-emerald-700/80 bg-emerald-950/90 px-3 py-2.5 text-xs text-emerald-50 placeholder:text-emerald-400/50 focus:border-emerald-400 outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-emerald-100/90">간단한 내용 (선택)</label>
          <textarea
            name="description"
            rows={2}
            placeholder="예: 오늘 첫 홀 드라이버"
            className="w-full rounded-lg border border-emerald-700/80 bg-emerald-950/90 px-3 py-2.5 text-xs text-emerald-50 placeholder:text-emerald-400/50 focus:border-emerald-400 outline-none resize-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-emerald-100/90">태그 / 앨범 (선택, 쉼표 구분)</label>
          <input
            name="tags"
            type="text"
            placeholder="예: 2025, 남서울CC, 라운드12"
            className="w-full rounded-lg border border-emerald-700/80 bg-emerald-950/90 px-3 py-2.5 text-xs text-emerald-50 placeholder:text-emerald-400/50 focus:border-emerald-400 outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-emerald-100/90">이미지 (JPEG, PNG, GIF, WebP, 10MB 이하, 여러 장 선택 가능)</label>
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="w-full text-[11px] text-emerald-100 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-700/80 file:px-3 file:py-1.5 file:text-emerald-50"
          />
        </div>
        {uploadError && (
          <p className="text-[11px] text-red-300">{uploadError}</p>
        )}
        <button
          type="submit"
          disabled={uploading}
          className="w-full rounded-xl bg-emerald-600/90 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {uploading ? "업로드 중…" : "선택한 사진 올리기"}
        </button>
      </form>

      {allTags.length > 0 && (
        <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
          <p className="text-[11px] font-medium text-emerald-100/90 mb-2">앨범 / 태그로 보기</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
                selectedTag === null
                  ? "bg-emerald-500 text-emerald-950"
                  : "bg-emerald-800/70 text-emerald-100 hover:bg-emerald-700/80"
              }`}
            >
              전체
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
                  selectedTag === tag
                    ? "bg-emerald-500 text-emerald-950"
                    : "bg-emerald-800/70 text-emerald-100 hover:bg-emerald-700/80"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <p className="text-[11px] text-emerald-200/85">
          {selectedTag ? `태그 "${selectedTag}" (${filteredItems.length}장)` : "썸네일을 누르면 크게 보기"}
        </p>
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-700/70 bg-emerald-950/40 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-emerald-100/90">
              {selectedTag ? `"${selectedTag}" 태그 사진이 없습니다.` : "아직 올린 사진이 없습니다."}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {filteredItems.map((item, index) => (
              <li key={item.id}>
                <div className="w-full rounded-2xl border border-emerald-800/70 overflow-hidden bg-emerald-950/80 shadow-md hover:border-emerald-600/80 transition">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="w-full text-left"
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
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-emerald-50 truncate">
                        {item.title}
                      </p>
                      {item.tags && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.tags
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean)
                            .slice(0, 3)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-emerald-800/70 px-1.5 py-0.5 text-[9px] text-emerald-200/90"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      )}
                      {item.description && (
                        <p className="mt-1 text-[11px] text-emerald-200/80 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center justify-end border-t border-emerald-800/60 px-2.5 py-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      disabled={deletingId === item.id}
                      className="rounded-lg px-2 py-1 text-[11px] font-medium text-red-300 hover:bg-red-950/60 hover:text-red-200 disabled:opacity-50"
                      aria-label={`${item.title} 삭제`}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Lightbox: 슬라이드로 크게 보기 */}
      {current && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="사진 크게 보기"
        >
          {/* 배경 클릭 시 닫기 */}
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
              <p className="mt-1 text-[11px] text-white/80">{current.description}</p>
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
                  onClick={() => { setEditingTagsId(null); setEditingTagsValue(""); }}
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
          {/* 삭제: 왼쪽 위 */}
          <button
            type="button"
            onClick={(e) => current && handleDelete(e, current.id)}
            disabled={current ? deletingId === current.id : true}
            className="absolute top-3 left-3 z-20 rounded-full bg-red-600/80 p-2.5 text-white hover:bg-red-500 disabled:opacity-50"
            aria-label="사진 삭제"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          {/* 닫기: 오른쪽 위 */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-3 right-3 z-20 rounded-full bg-white/20 p-2.5 text-white hover:bg-white/30"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                aria-label="이전"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                aria-label="다음"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <p className="absolute bottom-14 left-0 right-0 z-20 text-center text-[11px] text-white/60">
                {lightboxIndex! + 1} / {filteredItems.length}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
