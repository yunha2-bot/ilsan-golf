"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/** 카드 1개 높이(대략), px */
const CARD_HEIGHT = 200;
/** 상단(헤더+버튼+섹션제목+패딩 등) 예상 높이, px */
const RESERVED_HEIGHT = 320;

const MIN_PER_PAGE = 4;
const MAX_PER_PAGE = 10;

function getPerPageFromViewport(): number {
  if (typeof window === "undefined") return 4;
  const h = window.innerHeight;
  const available = h - RESERVED_HEIGHT;
  const count = Math.floor(available / CARD_HEIGHT);
  return Math.max(MIN_PER_PAGE, Math.min(MAX_PER_PAGE, count));
}

/**
 * 홈에서만 사용. URL에 perPage가 없을 때 한 번만 뷰포트 높이로 perPage를 계산해 쿼리로 반영합니다.
 */
export function HomeViewportSync() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const didRun = useRef(false);

  useEffect(() => {
    if (pathname !== "/" || didRun.current) return;
    const hasPerPage = searchParams.has("perPage");
    if (hasPerPage) {
      didRun.current = true;
      return;
    }
    didRun.current = true;
    const ideal = getPerPageFromViewport();
    const params = new URLSearchParams(searchParams.toString());
    params.set("perPage", String(ideal));
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
