import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <p className="text-center text-sm font-semibold text-emerald-50">
        페이지를 찾을 수 없습니다.
      </p>
      <p className="text-center text-[11px] text-emerald-200/85">
        주소를 확인하거나 홈으로 이동해 주세요.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-500"
      >
        홈으로 가기
      </Link>
    </div>
  );
}
