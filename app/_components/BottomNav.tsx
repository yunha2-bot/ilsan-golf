'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { setStatsChosen } from "./EnsureHomeFirst";

const tabs = [
  { href: "/", label: "홈", subLabel: "최근 스코어" },
  { href: "/stats", label: "평균", subLabel: "멤버별", onNavigate: setStatsChosen },
  { href: "/gallery", label: "갤러리", subLabel: "추억" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-emerald-900/40 bg-emerald-950/95 text-xs text-emerald-50 shadow-[0_-4px_20px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-4 py-2">
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

