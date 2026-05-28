"use client";

import { useEffect, useState } from "react";

type WinnerComment = {
  id: number;
  author: string;
  message: string;
  createdAt: string;
};

export function WinnerComments({
  winnersKey,
  roundDateIso,
  authorOptions,
  readOnly = false,
}: {
  winnersKey: string;
  roundDateIso: string;
  authorOptions?: string[];
  readOnly?: boolean;
}) {
  const [comments, setComments] = useState<WinnerComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [author, setAuthor] = useState(authorOptions?.[0] ?? "익명");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/stats/winners/comments?winnersKey=${encodeURIComponent(winnersKey)}`)
      .then((res) => {
        if (!res.ok) throw new Error("load failed");
        return res.json() as Promise<{ comments: WinnerComment[] }>;
      })
      .then((json) => {
        if (!alive) return;
        setComments(json.comments);
      })
      .catch(() => {})
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [winnersKey]);

  async function submitComment() {
    const trimmed = message.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/stats/winners/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnersKey,
          roundDate: roundDateIso,
          author,
          message: trimmed,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      const created = (await res.json()) as WinnerComment;
      setComments((prev) => [...prev, created]);
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/stats/winners/comments?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      setComments((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-emerald-800/60 bg-emerald-950/60 px-2.5 py-2">
      <p className="text-[10px] font-semibold text-emerald-200/90">축하메시지</p>
      {!readOnly && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <select
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="rounded-md border border-emerald-700/70 bg-emerald-900/60 px-2 py-1 text-[11px] text-emerald-100"
          >
            {(authorOptions ?? ["익명"]).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
            placeholder="축하메시지를 남겨주세요"
            className="min-w-[180px] flex-1 rounded-md border border-emerald-700/70 bg-emerald-900/60 px-2 py-1 text-[11px] text-emerald-50 placeholder:text-emerald-300/60"
          />
          <button
            type="button"
            onClick={submitComment}
            disabled={submitting || message.trim().length === 0}
            className="rounded-md bg-amber-500/90 px-2.5 py-1 text-[11px] font-semibold text-amber-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "저장중" : "등록"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="mt-2 text-[10px] text-emerald-300/80">불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p className="mt-2 text-[10px] text-emerald-300/80">
          {readOnly ? "등록된 축하메시지가 없습니다." : "첫 축하메시지를 남겨보세요."}
        </p>
      ) : (
        <div className="mt-2 space-y-1">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start justify-between gap-2">
              <p className="text-[10px] text-emerald-100/90">
                <span className="font-semibold text-amber-200">{comment.author}</span>:{" "}
                {comment.message}
              </p>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => deleteComment(comment.id)}
                  disabled={deletingId === comment.id}
                  className="shrink-0 text-[10px] text-emerald-300/80 underline underline-offset-2 hover:text-emerald-100 disabled:opacity-50"
                >
                  {deletingId === comment.id ? "삭제중" : "삭제"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
