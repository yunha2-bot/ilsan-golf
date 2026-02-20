import Link from "next/link";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getFileUrl } from "@/lib/uploadConfig";
import { HomeViewportSync } from "./_components/HomeViewportSync";
import { ScorecardButton } from "./_components/ScorecardLightbox";
import { DeleteRoundButton } from "./_components/DeleteRoundButton";

type RoundWithScores = Prisma.RoundGetPayload<{
  include: { scores: { include: { member: true } } };
}>;

const DEFAULT_PER_PAGE = 4;
const MIN_PER_PAGE = 4;
const MAX_PER_PAGE = 10;

function formatDate(date: Date) {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

export default async function Home(props: {
  searchParams?: Promise<{ page?: string; perPage?: string }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const currentPage = Number(searchParams.page ?? "1") || 1;
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(MIN_PER_PAGE, Number(searchParams.perPage ?? DEFAULT_PER_PAGE) || DEFAULT_PER_PAGE),
  );

  let totalRounds = 0;
  let members: { id: number; name: string }[] = [];
  let rounds: RoundWithScores[] = [];

  try {
    totalRounds = await prisma.round.count();
    const totalPages = Math.max(1, Math.ceil(totalRounds / perPage));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    const [membersList, roundsList] = await Promise.all([
      prisma.member.findMany({ orderBy: { id: "asc" } }),
      prisma.round.findMany({
        orderBy: { date: "desc" },
        skip: (safePage - 1) * perPage,
        take: perPage,
        include: {
          scores: {
            include: {
              member: true,
            },
          },
        },
      }),
    ]);
    members = membersList.slice(0, 4);
    rounds = roundsList;
  } catch {
    // DB 연결 실패 시 빈 목록으로 표시
  }

  const totalPages = Math.max(1, Math.ceil(totalRounds / perPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const memberOrder = members.slice(0, 4).map((m) => m.id);

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <HomeViewportSync />
      </Suspense>
      <Link
        href="/rounds/new"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-500 bg-emerald-600/90 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-emerald-900/50 transition hover:bg-emerald-500 hover:border-emerald-400"
      >
        <span aria-hidden>＋</span>
        스코어 입력하기
      </Link>
      <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
        <p className="text-[11px] font-medium text-emerald-100/90">총 {totalRounds} 라운드 기록</p>
      </section>

      <section className="space-y-3">
        {rounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-700/70 bg-emerald-950/40 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-emerald-50">
              아직 기록된 라운드가 없습니다.
            </p>
            <p className="mt-1 text-[11px] text-emerald-200/85">
              첫 라운드를 기록하면 이곳에 스코어 카드가 나타납니다.
            </p>
          </div>
        ) : (
          rounds.map((round) => {
            const orderedScores = [...round.scores].sort((a, b) => {
              const ai = memberOrder.indexOf(a.memberId);
              const bi = memberOrder.indexOf(b.memberId);
              return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            });

            const bestScore = orderedScores.reduce<number | null>(
              (best, s) =>
                best === null ? s.strokes : Math.min(best, s.strokes),
              null,
            );
            const byStrokes = [...round.scores].sort((a, b) => a.strokes - b.strokes);
            const rankLabels = ["1등", "2등", "3등", "4등"];

            return (
              <article
                key={round.id}
                className="relative overflow-hidden rounded-2xl border border-emerald-800/70 bg-gradient-to-br from-emerald-950/95 via-emerald-900/95 to-emerald-950/95 p-4 shadow-lg shadow-emerald-950/70"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300/80">
                      Round #{round.id}
                    </p>
                    <h2 className="mt-1 text-sm font-semibold text-emerald-50">
                      {round.course || "코스 미지정"}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-emerald-200/85">
                      {formatDate(round.date)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/rounds/${round.id}/edit`}
                        className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
                      >
                        수정
                      </Link>
                      {(round as { scorecardImagePath?: string | null }).scorecardImagePath && (
                        <ScorecardButton
                          imageUrl={getFileUrl((round as { scorecardImagePath: string }).scorecardImagePath)}
                        />
                      )}
                      <DeleteRoundButton roundId={round.id} />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    {bestScore !== null && (
                      <div className="rounded-xl bg-emerald-800/90 px-2.5 py-1 text-[10px] text-emerald-50 shadow-sm shadow-emerald-900">
                        <p className="font-semibold tracking-wide">Best {bestScore}</p>
                      </div>
                    )}
                    {byStrokes.length > 0 && (
                      <div className="text-[10px] text-emerald-200/90">
                        {byStrokes.slice(0, 4).map((s, i) => (
                          <p key={s.id}>
                            {rankLabels[i]}{" "}
                            <Link
                              href={`/rounds/${round.id}/score/${s.member.id}`}
                              className="font-medium text-emerald-100 hover:text-emerald-50 hover:underline"
                            >
                              {s.member.name}
                            </Link>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  {orderedScores.map((score) => (
                    <Link
                      key={score.id}
                      href={`/rounds/${round.id}/score/${score.member.id}`}
                      className="flex items-center justify-between rounded-xl border border-emerald-800/70 bg-emerald-950/80 px-2 py-1.5 hover:bg-emerald-800/70 hover:border-emerald-700/80 transition"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-medium text-emerald-100 truncate">
                          {score.member.name}
                        </span>
                        <span className="text-[10px] text-emerald-300/80">
                          Total
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-100 flex-shrink-0">
                        {score.strokes}
                      </span>
                    </Link>
                  ))}
                </div>

                {round.note && (
                  <p className="mt-3 rounded-xl bg-emerald-900/70 px-3 py-2 text-[11px] text-emerald-100/90">
                    {round.note}
                  </p>
                )}
              </article>
            );
          })
        )}
      </section>

      {totalPages > 1 && (
        <section className="mt-2 flex items-center justify-center gap-2 text-[11px]">
          <PaginationButton
            disabled={safePage === 1}
            page={safePage - 1}
            perPage={perPage}
          >
            이전
          </PaginationButton>
          <span className="rounded-full bg-emerald-900/80 px-3 py-1 text-[11px] font-medium text-emerald-50">
            {safePage} / {totalPages}
          </span>
          <PaginationButton
            disabled={safePage === totalPages}
            page={safePage + 1}
            perPage={perPage}
          >
            다음
          </PaginationButton>
        </section>
      )}
    </div>
  );
}

function PaginationButton({
  disabled,
  page,
  perPage,
  children,
}: {
  disabled: boolean;
  page: number;
  perPage: number;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <button
        className="cursor-default rounded-full border border-emerald-800/60 bg-emerald-950/60 px-3 py-1 text-[11px] font-medium text-emerald-500/60"
        disabled
      >
        {children}
      </button>
    );
  }

  const params = new URLSearchParams();
  if (page !== 1) params.set("page", String(page));
  if (perPage !== DEFAULT_PER_PAGE) params.set("perPage", String(perPage));
  const qs = params.toString();
  const href = qs ? `/?${qs}` : "/";

  return (
    <a
      href={href}
      className="rounded-full border border-emerald-700/80 bg-emerald-900/90 px-3 py-1 text-[11px] font-medium text-emerald-50 shadow-sm shadow-emerald-950/70"
    >
      {children}
    </a>
  );
}

