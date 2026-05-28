"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export type GalleryItem = {
  id: number;
  title: string;
  description: string | null;
  tags: string;
  filePath: string;
  imageUrl: string;
  groupId: string | null;
  isCover: boolean;
  roundId: number | null;
  createdAt: string;
};

type RoundOption = { id: number; label: string };

function isVideo(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov");
}

export function GalleryGroupClient({
  items,
  groupKey,
  rounds = [],
  initialRoundId = null,
}: {
  items: GalleryItem[];
  groupKey: string;
  rounds?: RoundOption[];
  initialRoundId?: number | null;
}) {
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [list, setList] = useState<GalleryItem[]>(items);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingTags, setEditingTags] = useState("");
  const [editingPostTitle, setEditingPostTitle] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [settingCoverId, setSettingCoverId] = useState<number | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(initialRoundId);
  const [linkingRound, setLinkingRound] = useState(false);
  const uploadedFileKeysRef = useRef<Set<string>>(new Set());

  const coverItem = list.find((i) => i.isCover) ?? list[0] ?? null;
  const canAddToGroup = groupKey !== "" && !groupKey.startsWith("single-");

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

  const handleSetCover = async (itemId: number) => {
    setError(null);
    setSettingCoverId(itemId);
    try {
      const res = await fetch(`/api/gallery/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCover: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "대표사진 설정 실패");
      }
      setList((prev) =>
        prev.map((i) => ({ ...i, isCover: i.id === itemId })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "대표사진 설정 실패");
    } finally {
      setSettingCoverId(null);
    }
  };

  const handleLinkRound = async (roundId: number | null) => {
    setLinkingRound(true);
    setError(null);
    try {
      const res = await fetch(`/api/gallery/group/${encodeURIComponent(groupKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "연결 실패");
      }
      setSelectedRoundId(roundId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "라운드 연결 중 오류");
    } finally {
      setLinkingRound(false);
    }
  };

  const handleSavePostTitle = async () => {
    if (!coverItem) return;
    setError(null);
    try {
      const res = await fetch(`/api/gallery/${coverItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle.trim() || "제목 없음",
          description: postDescription.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("저장 실패");
      const data = (await res.json()) as GalleryItem;
      setList((prev) =>
        prev.map((i) =>
          i.id === coverItem.id
            ? { ...i, title: data.title, description: data.description }
            : i,
        ),
      );
      setEditingPostTitle(false);
    } catch {
      setError("제목·내용 저장에 실패했습니다.");
    }
  };

  const handleAddMedia = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canAddToGroup) return;
    const form = e.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[name="newFile"]');
    const files = fileInput?.files ? Array.from(fileInput.files) : [];
    const valid = files.filter(
      (f) =>
        f?.size &&
        (f.type.startsWith("image/") || f.type.startsWith("video/")),
    );
    if (valid.length === 0) {
      setUploadError("이미지 또는 동영상을 선택해 주세요.");
      return;
    }
    const toUpload = valid.filter(
      (f) => !uploadedFileKeysRef.current.has(fileKey(f)),
    );
    const skippedCount = valid.length - toUpload.length;
    if (toUpload.length === 0) {
      setUploadError(
        skippedCount > 0
          ? "선택한 파일은 이미 올린 파일입니다. 새 파일만 올려 주세요."
          : "이미지 또는 동영상을 선택해 주세요.",
      );
      return;
    }
    setUploadError(null);
    setUploading(true);
    const postTitle = coverItem?.title ?? "제목 없음";
    const CONCURRENCY = 3;

    const uploadOne = async (i: number, file: File): Promise<{ index: number; data?: GalleryItem & { imageUrl: string }; error?: string }> => {
      try {
        const body = new FormData();
        body.set("title", postTitle);
        body.set("groupId", groupKey);
        body.set("isCover", "false");
        body.set("file", file);
        const res = await fetch("/api/gallery/upload", { method: "POST", body });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { index: i, error: (data as { error?: string }).error || "업로드 실패" };
        }
        const data = (await res.json()) as GalleryItem & { imageUrl: string };
        return { index: i, data };
      } catch (err) {
        return { index: i, error: err instanceof Error ? err.message : "업로드 실패" };
      }
    };

    try {
      const results: { index: number; data?: GalleryItem & { imageUrl: string }; error?: string }[] = [];
      for (let start = 0; start < toUpload.length; start += CONCURRENCY) {
        const chunk = toUpload.slice(start, start + CONCURRENCY);
        const batch = await Promise.all(
          chunk.map((file, j) => uploadOne(start + j, file)),
        );
        results.push(...batch);
      }

      const succeeded = results
        .filter((r): r is { index: number; data: GalleryItem & { imageUrl: string } } => !!r.data)
        .sort((a, b) => a.index - b.index);
      const failed = results.filter((r) => r.error);

      for (const r of succeeded) {
        if (!r.data) continue;
        uploadedFileKeysRef.current.add(fileKey(toUpload[r.index]));
        setList((prev) => [
          ...prev,
          {
            id: r.data.id,
            title: r.data.title,
            description: r.data.description ?? null,
            tags: r.data.tags,
            filePath: r.data.filePath,
            imageUrl: r.data.imageUrl,
            groupId: r.data.groupId,
            isCover: r.data.isCover,
            roundId: r.data.roundId ?? null,
            createdAt: r.data.createdAt,
          },
        ]);
      }
      if (succeeded.length > 0) form.reset();

      let errMsg: string | null = null;
      if (failed.length > 0) {
        errMsg =
          failed.length === toUpload.length
            ? failed[0]!.error!
            : `${succeeded.length}개 성공, ${failed.length}개 실패 (예: ${failed[0]!.error})`;
      }
      if (skippedCount > 0) {
        errMsg = errMsg
          ? `${errMsg} (이미 올린 파일 ${skippedCount}개 제외)`
          : `이미 올린 파일 ${skippedCount}개는 제외했습니다.`;
      }
      setUploadError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async (
    itemId: number,
    payload: { title: string; description: string; tags: string },
  ) => {
    setError(null);
    try {
      const res = await fetch(`/api/gallery/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title.trim() || "제목 없음",
          description: payload.description.trim() || null,
          tags: payload.tags
            .split(/[,，\s]+/)
            .map((t) => t.trim())
            .filter(Boolean)
            .join(","),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "저장 실패");
      }
      const data = (await res.json()) as GalleryItem;
      setList((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                title: data.title,
                description: data.description,
                tags: data.tags,
              }
            : i,
        ),
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정 저장에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-4">
      {/* 게시글 제목·내용 수정 (상단) */}
      {coverItem && (
        <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3">
          {editingPostTitle ? (
            <div className="space-y-2">
              <label className="text-[10px] text-emerald-200/80 block">제목</label>
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="제목"
                className="w-full rounded-lg border border-emerald-700/80 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-50"
              />
              <label className="text-[10px] text-emerald-200/80 block">내용 (선택)</label>
              <textarea
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                placeholder="내용"
                rows={2}
                className="w-full rounded-lg border border-emerald-700/80 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-50 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSavePostTitle}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPostTitle(false);
                    setPostTitle(coverItem.title);
                    setPostDescription(coverItem.description || "");
                  }}
                  className="rounded-lg bg-emerald-800/80 px-3 py-1.5 text-[11px] text-emerald-200"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-emerald-50">
                  {coverItem.title}
                </h2>
                {coverItem.description && (
                  <p className="mt-1 text-[11px] text-emerald-200/90">
                    {coverItem.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPostTitle(coverItem.title);
                  setPostDescription(coverItem.description || "");
                  setEditingPostTitle(true);
                }}
                className="rounded-lg px-2 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-800/60"
              >
                제목·내용 수정
              </button>
            </div>
          )}
        </section>
      )}

      {/* 라운드 연결 */}
      {rounds.length > 0 && (
        <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3">
          <p className="text-[11px] font-medium text-emerald-100/90 mb-2">라운드 연결</p>
          <div className="flex items-center gap-2">
            <select
              value={selectedRoundId ?? ""}
              onChange={(e) => {
                const val = e.target.value === "" ? null : Number(e.target.value);
                handleLinkRound(val);
              }}
              disabled={linkingRound}
              className="flex-1 rounded-lg border border-emerald-700/80 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-50 disabled:opacity-60"
            >
              <option value="">라운드 없음</option>
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            {linkingRound && (
              <span className="text-[11px] text-emerald-300/80">저장 중…</span>
            )}
            {!linkingRound && selectedRoundId && (
              <span className="text-[11px] text-emerald-400">연결됨</span>
            )}
          </div>
        </section>
      )}

      {/* 이 게시글에 사진/동영상 추가 */}
      {canAddToGroup && (
        <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/50 px-4 py-3">
          <p className="text-[11px] font-medium text-emerald-100/90 mb-2">
            이 게시글에 사진·동영상 추가
          </p>
          <form onSubmit={handleAddMedia} className="space-y-2">
            <input
              name="newFile"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
              multiple
              className="w-full text-[11px] text-emerald-100 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-700/80 file:px-3 file:py-1.5 file:text-emerald-50"
            />
            {uploadError && (
              <p className="text-[11px] text-red-300">{uploadError}</p>
            )}
            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-xl bg-emerald-600/90 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {uploading ? "업로드 중…" : "추가하기"}
            </button>
          </form>
        </section>
      )}

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {list.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="w-full rounded-2xl border border-emerald-800/70 overflow-hidden bg-emerald-950/80 shadow-md hover:border-emerald-600/80 transition text-left"
            >
              <div className="aspect-square relative bg-emerald-900/60">
                {isVideo(item.filePath) ? (
                  <>
                    <video
                      src={item.imageUrl}
                      className="w-full h-full object-cover bg-emerald-900/80"
                      muted
                      preload="metadata"
                      playsInline
                      aria-hidden
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                      <span className="rounded-full bg-white/90 p-2 text-emerald-900" aria-hidden>
                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
          aria-label={isVideo(current.filePath) ? "동영상 보기" : "사진 크게 보기"}
        >
          <button
            type="button"
            className="absolute inset-0 z-0"
            onClick={() => setLightboxIndex(null)}
            aria-label="닫기"
          />
          <div className="flex-1 flex items-center justify-center min-h-0 p-4 relative z-10 pointer-events-none [&_video]:pointer-events-auto">
            {isVideo(current.filePath) ? (
              <video
                src={current.imageUrl}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                playsInline
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={current.imageUrl}
                alt={current.title}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          <div className="flex-shrink-0 px-4 pb-6 pt-2 text-center relative z-10">
            {editingId === current.id ? (
              <div className="mt-2 space-y-2 max-w-sm mx-auto text-left">
                <div>
                  <label className="text-[10px] text-white/70 block mb-0.5">제목</label>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    placeholder="제목"
                    className="w-full rounded-lg border border-white/30 bg-black/50 px-2 py-1.5 text-xs text-white placeholder:text-white/50"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/70 block mb-0.5">내용</label>
                  <textarea
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    placeholder="내용 (선택)"
                    rows={2}
                    className="w-full rounded-lg border border-white/30 bg-black/50 px-2 py-1.5 text-xs text-white placeholder:text-white/50 resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/70 block mb-0.5">태그 (쉼표 구분)</label>
                  <input
                    type="text"
                    value={editingTags}
                    onChange={(e) => setEditingTags(e.target.value)}
                    placeholder="예: 2025, 남서울CC"
                    className="w-full rounded-lg border border-white/30 bg-black/50 px-2 py-1.5 text-xs text-white placeholder:text-white/50"
                  />
                </div>
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveEdit(current.id, {
                        title: editingTitle,
                        description: editingDescription,
                        tags: editingTags,
                      })
                    }
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditingTitle("");
                      setEditingDescription("");
                      setEditingTags("");
                    }}
                    className="rounded-lg bg-white/20 px-3 py-1.5 text-[11px] text-white"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-white">{current.title}</p>
                {current.description && (
                  <p className="mt-1 text-[11px] text-white/80">
                    {current.description}
                  </p>
                )}
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
                  {list.length > 1 &&
                    (current.isCover ? (
                      <span className="rounded bg-amber-500/80 px-2 py-0.5 text-[10px] text-white">
                        대표 사진
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetCover(current.id)}
                        disabled={settingCoverId === current.id}
                        className="rounded bg-amber-600/80 px-2 py-0.5 text-[10px] text-white hover:bg-amber-500 disabled:opacity-50"
                      >
                        {settingCoverId === current.id ? "설정 중…" : "대표 사진으로 설정"}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(current.id);
                      setEditingTitle(current.title);
                      setEditingDescription(current.description || "");
                      setEditingTags(current.tags || "");
                    }}
                    className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/70 hover:bg-white/20"
                  >
                    수정
                  </button>
                </div>
              </>
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
