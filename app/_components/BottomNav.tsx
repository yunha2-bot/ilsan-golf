'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { setStatsChosen } from "./EnsureHomeFirst";

function BackToSecretaryMobile() {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("from") === "ai-secretary") {
      localStorage.setItem("from_ai_secretary", "1");
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
      className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-colors text-emerald-200 hover:bg-emerald-800/60 hover:text-white"
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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 md:hidden border-t border-emerald-900/40 bg-emerald-950/95 text-xs text-emerald-50 shadow-[0_-4px_20px_rgba(0,0,0,0.45)] backdrop-blur-md safe-area-bottom">
      <div className="mx-auto flex max-w-md sm:max-w-lg items-stretch justify-between px-4 py-2">
        <BackToSecretaryMobile />
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
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-colors",
                active
                  ? "bg-emerald-700 text-white"
                  : "text-emerald-200 hover:bg-emerald-800/60 hover:text-white"
              )}
            >
              <span className="text-[11px] font-semibold tracking-wide">
                {tab.label}
              </span>
              <span className="text-[10px] text-emerald-100/80">
                {tab.subLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

