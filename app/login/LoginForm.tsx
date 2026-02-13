"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "비밀번호가 올바르지 않습니다.");
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xs pt-8">
      <p className="text-center text-xs text-emerald-200/90">
        접속하려면 비밀번호를 입력하세요.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full rounded-xl border border-emerald-700/80 bg-emerald-900/60 px-4 py-3 text-xs text-emerald-50 placeholder:text-emerald-400/60 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          autoFocus
          disabled={pending}
        />
        {error && (
          <p className="text-center text-[11px] text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {pending ? "확인 중…" : "입장"}
        </button>
      </form>
    </div>
  );
}
