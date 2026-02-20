"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";

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

function getGroupKey(item: GalleryItem): string {
  return item.groupId ?? `single-${item.id}`;
}

export function GalleryClient({
  items: initialItems,
}: {
  items: GalleryItem[];
}) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  // 그룹별로 묶기: 한 게시글 = 대표 사진 1장 카드, 클릭 시 상세에서 전부 보기
  const groups = useMemo(() => {
    const byKey = new Map<string, GalleryItem[]>();
    for (const item of filteredItems) {
      const key = getGroupKey(item);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(item);
    }
    return Array.from(byKey.entries()).map(([key, groupItems]) => {
      const cover =
        groupItems.find((i) => i.isCover) ?? groupItems[0]!;
      return { key, cover, items: groupItems };
    });
  }, [filteredItems]);

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
    const batchGroupId =
      validFiles.length > 1 ? crypto.randomUUID() : null;
    let uploaded: GalleryItem[] = [];
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const body = new FormData();
        body.set("title", title);
        if (description) body.set("description", description);
        body.set("tags", tags);
        body.set("file", validFiles[i]);
        if (batchGroupId) {
          body.set("groupId", batchGroupId);
          body.set("isCover", i === 0 ? "true" : "false");
        } else {
          body.set("isCover", "true");
        }
        const res = await fetch("/api/gallery/upload", {
          method: "POST",
          body,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || "업로드 실패");
        }
        const data = (await res.json()) as GalleryItem & {
          imageUrl: string;
          groupId?: string | null;
          isCover?: boolean;
        };
        uploaded.push({
          id: data.id,
          title: data.title,
          description: data.description ?? null,
          tags: (data as GalleryItem).tags ?? "",
          filePath: data.filePath,
          imageUrl: data.imageUrl,
          groupId: data.groupId ?? null,
          isCover: data.isCover ?? false,
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
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "삭제 중 오류");
    } finally {
      setDeletingId(null);
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
          <label className="text-[11px] font-medium text-emerald-100/90">
            이미지 (JPEG, PNG, GIF, WebP, 10MB 이하, 여러 장 선택 가능)
          </label>
          <p className="text-[10px] text-emerald-300/80 mt-0.5">
            여러 장 선택 시 첫 사진이 대표 사진으로 표시됩니다.
          </p>
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
          {selectedTag
            ? `태그 "${selectedTag}" (${groups.length}개 게시글)`
            : "카드를 누르면 해당 게시글의 사진들을 볼 수 있습니다."}
        </p>
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-700/70 bg-emerald-950/40 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-emerald-100/90">
              {selectedTag ? `"${selectedTag}" 태그 사진이 없습니다.` : "아직 올린 사진이 없습니다."}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {groups.map(({ key, cover, items: groupItems }) => (
              <li key={key}>
                <div className="w-full rounded-2xl border border-emerald-800/70 overflow-hidden bg-emerald-950/80 shadow-md hover:border-emerald-600/80 transition">
                  <Link
                    href={`/gallery/group/${encodeURIComponent(key)}`}
                    className="block w-full text-left"
                  >
                    <div className="aspect-square relative bg-emerald-900/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cover.imageUrl}
                        alt={cover.title}
                        className="w-full h-full object-cover bg-emerald-900/80"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) (fallback as HTMLElement).style.display = "flex";
                        }}
                      />
                      {groupItems.length > 1 && (
                        <span className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                          {groupItems.length}장
                        </span>
                      )}
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
                        {cover.title}
                      </p>
                      {cover.tags && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {cover.tags
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
                      {cover.description && (
                        <p className="mt-1 text-[11px] text-emerald-200/80 line-clamp-2">
                          {cover.description}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center justify-end border-t border-emerald-800/60 px-2.5 py-1.5">
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        if (deletingId !== null) return;
                        for (const item of groupItems) {
                          setDeletingId(item.id);
                          try {
                            const res = await fetch(`/api/gallery/${item.id}`, {
                              method: "DELETE",
                            });
                            if (!res.ok) throw new Error("삭제 실패");
                            setItems((prev) => prev.filter((i) => i.id !== item.id));
                          } catch (err) {
                            setUploadError(err instanceof Error ? err.message : "삭제 중 오류");
                            break;
                          } finally {
                            setDeletingId(null);
                          }
                        }
                      }}
                      disabled={deletingId !== null}
                      className="rounded-lg px-2 py-1 text-[11px] font-medium text-red-300 hover:bg-red-950/60 hover:text-red-200 disabled:opacity-50"
                      aria-label="게시글 삭제"
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
    </div>
  );
}
