"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { setStatsChosen } from "./EnsureHomeFirst";

function BackToSecretaryLink() {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    // URL에 ?from=ai-secretary 파라미터가 있으면 localStorage에 저장
    if (new URLSearchParams(window.location.search).get("from") === "ai-secretary") {
      localStorage.setItem("from_ai_secretary", "1");
      // 파라미터 제거 (URL 노출 방지)
      const url = new URL(window.location.href);
      url.searchParams.delete("from");
      window.history.replaceState({}, "", url.toString());
    }
    setShow(localStorage.getItem("from_ai_secretary") === "1");
  }, []);

  if (!show) return null;
  const url = window.location.protocol === 'https:' || window.location.hostname.includes('synology')
    ? 'https://ai.yoonha.synology.me'
    : `http://${window.location.hostname}:3200`;
  return (
    <a
      href={url}
      className="flex flex-col items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition min-h-[3.25rem] text-emerald-200 hover:bg-emerald-800/70 hover:text-emerald-50"
    >
      <img src="https://ai.yoonha.synology.me/icon-192.svg" alt="AI비서" width={32} height={32} style={{ borderRadius: 8 }} />
    </a>
  );
}

const tabs = [
  { href: "/", label: "홈", subLabel: "최근 스코어" },
  { href: "/stats", label: "평균", subLabel: "멤버별", onNavigate: setStatsChosen },
  { href: "/gallery", label: "갤러리", subLabel: "추억" },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1" aria-label="메인 메뉴">
      <BackToSecretaryLink />
      {tabs.map((tab) => {
        const active =
          tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={() => tab.onNavigate?.()}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition min-h-[3.25rem]",
              active
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
                : "text-emerald-200 hover:bg-emerald-800/70 hover:text-emerald-50"
            )}
          >
            <span>{tab.label}</span>
            <span className="text-[11px] font-normal opacity-85 mt-0.5">
              {tab.subLabel}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
