import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <p className="text-center text-sm font-medium text-emerald-100/90">
        페이지를 찾을 수 없습니다.
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
