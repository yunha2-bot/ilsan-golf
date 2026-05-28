"use client";

import { useEffect, useState } from "react";

type BettingNotice = {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export function BettingNoticeBoard() {
  const [notices, setNotices] = useState<BettingNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch("/api/stats/notices")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json: { notices: BettingNotice[] }) => {
        if (!alive) return;
        setNotices(json.notices);
      })
      .catch(() => {})
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function createNotice() {
    const content = newContent.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/stats/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return;
      const created = (await res.json()) as BettingNotice;
      setNotices((prev) => [created, ...prev]);
      setNewContent("");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit() {
    if (editingId == null) return;
    const content = editingContent.trim();
    if (!content) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/stats/notices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, content }),
      });
      if (!res.ok) return;
      const updated = (await res.json()) as BettingNotice;
      setNotices((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setEditingId(null);
      setEditingContent("");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteNotice(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/stats/notices?id=${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const latestNotice = notices[0]?.content ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 text-left shadow-lg shadow-emerald-950/60"
      >
        <p className="text-sm font-semibold text-emerald-50">공지사항</p>
        <p className="mt-1 whitespace-pre-line break-words text-[11px] leading-5 text-emerald-200/85">
          {loading
            ? "불러오는 중..."
            : latestNotice ?? "등록된 공지사항이 없습니다."}
        </p>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="공지사항 관리"
            className="fixed inset-x-4 top-1/2 z-50 max-h-[80vh] -translate-y-1/2 overflow-hidden rounded-2xl border border-emerald-700/70 bg-emerald-950 shadow-2xl md:inset-x-auto md:left-1/2 md:w-[620px] md:-translate-x-1/2"
          >
            <header className="flex items-center justify-between border-b border-emerald-800/60 px-4 py-3">
              <h3 className="text-sm font-semibold text-emerald-50">공지사항 관리</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-emerald-200 hover:bg-emerald-800/80"
                aria-label="닫기"
              >
                ✕
              </button>
            </header>
            <div className="max-h-[calc(80vh-58px)] overflow-y-auto px-4 py-3">
              <div className="flex flex-wrap items-start gap-2">
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  maxLength={500}
                  placeholder="공지사항을 입력하세요"
                  rows={3}
                  className="min-h-[72px] min-w-[220px] flex-1 rounded-md border border-emerald-700/70 bg-emerald-900/60 px-2 py-1.5 text-[11px] text-emerald-50 placeholder:text-emerald-300/60"
                />
                <button
                  type="button"
                  onClick={createNotice}
                  disabled={submitting || newContent.trim().length === 0}
                  className="rounded-md bg-emerald-500/90 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "등록중" : "등록"}
                </button>
              </div>

              {loading ? (
                <p className="mt-3 text-[11px] text-emerald-300/80">불러오는 중...</p>
              ) : notices.length === 0 ? (
                <p className="mt-3 text-[11px] text-emerald-300/80">등록된 공지사항이 없습니다.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {notices.map((notice) => (
                    <article
                      key={notice.id}
                      className="rounded-lg border border-emerald-800/60 bg-emerald-950/70 px-3 py-2"
                    >
                      {editingId === notice.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            maxLength={500}
                            rows={3}
                            className="min-h-[72px] w-full rounded-md border border-emerald-700/70 bg-emerald-900/60 px-2 py-1.5 text-[11px] text-emerald-50"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={savingEdit || editingContent.trim().length === 0}
                              className="rounded-md bg-emerald-500/90 px-2.5 py-1 text-[10px] font-semibold text-emerald-950 disabled:opacity-50"
                            >
                              {savingEdit ? "저장중" : "저장"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingContent("");
                              }}
                              className="rounded-md border border-emerald-700/80 px-2.5 py-1 text-[10px] text-emerald-200"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="whitespace-pre-line break-words text-[11px] leading-5 text-emerald-100/95">
                            {notice.content}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(notice.id);
                                setEditingContent(notice.content);
                              }}
                              className="text-emerald-300/90 underline underline-offset-2 hover:text-emerald-100"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteNotice(notice.id)}
                              disabled={deletingId === notice.id}
                              className="text-emerald-300/90 underline underline-offset-2 hover:text-emerald-100 disabled:opacity-50"
                            >
                              {deletingId === notice.id ? "삭제중" : "삭제"}
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
