import { NextResponse } from "next/server";
import courses from "@/lib/golf-courses.json";

export async function POST(req: Request) {
  const { name } = await req.json().catch(() => ({ name: "" }));
  if (!name || typeof name !== "string") {
    return NextResponse.json({ par: null, message: "골프장 이름을 입력해 주세요." }, { status: 400 });
  }

  const query = name.trim().toLowerCase().replace(/\s/g, "");

  // 정확히 일치하는 항목 우선, 없으면 포함 검색
  const exact = courses.find(
    (c) => c.name.toLowerCase().replace(/\s/g, "") === query
  );
  if (exact) {
    return NextResponse.json({ par: exact.par, matched: exact.name });
  }

  const partial = courses.filter((c) =>
    c.name.toLowerCase().replace(/\s/g, "").includes(query) ||
    query.includes(c.name.toLowerCase().replace(/\s/g, ""))
  );
  if (partial.length === 1) {
    return NextResponse.json({ par: partial[0].par, matched: partial[0].name });
  }
  if (partial.length > 1) {
    // 여러 개 매칭 시 가장 짧은 이름(가장 유사한 것) 반환
    const best = partial.sort((a, b) => a.name.length - b.name.length)[0];
    return NextResponse.json({ par: best.par, matched: best.name });
  }

  return NextResponse.json({ par: null, message: "등록된 골프장 정보가 없습니다." });
}
