"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const STATS_CHOSEN_KEY = "golf_chose_stats";

/**
 * 처음 웹페이지를 열었을 때 항상 홈(/)이 보이도록.
 * /stats로 직접 들어오거나 캐시로 열리면 홈으로 보냄. "평균" 탭을 눌러 온 경우는 유지.
 */
export function EnsureHomeFirst() {
  const pathname = usePathname();
  const router = useRouter();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (pathname !== "/stats" || didRedirect.current) return;
    if (typeof sessionStorage === "undefined") return;
    // "평균" 탭을 눌러 왔으면 세션에 표시되어 있음. 없으면 첫 진입이므로 홈으로.
    if (sessionStorage.getItem(STATS_CHOSEN_KEY)) return;
    didRedirect.current = true;
    router.replace("/");
  }, [pathname, router]);

  return null;
}

export function setStatsChosen() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(STATS_CHOSEN_KEY, "1");
  }
}
