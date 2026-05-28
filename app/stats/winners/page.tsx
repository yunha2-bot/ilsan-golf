import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WinnerComments } from "./_components/WinnerComments";

export const revalidate = 0;

const BETTING_EXCLUDED_NAME = "김상우";
const ITEMS_PER_PAGE = 5;

type WinnerHistoryItem = {
  winners: string[];
  roundDate: Date;
  memberDetails: {
    name: string;
    baselineAvg: number;
    currentStrokes: number;
    improvement: number;
  }[];
};

export default async function BettingWinnersPage({
  searchParams,
}: {
  searchParams: Promise<{ comment?: string; page?: string }>;
}) {
  const params = await searchParams;
  const activeCommentKey = params.comment ?? null;
  const currentPageRaw = Number(params.page ?? "1");
  const currentPage = Number.isInteger(currentPageRaw) && currentPageRaw > 0 ? currentPageRaw : 1;
  const [members, scores] = await Promise.all([
    prisma.member.findMany({ orderBy: { id: "asc" } }),
    prisma.score.findMany({
      include: {
        member: true,
        round: true,
      },
    }),
  ]);

  const memberList = members.slice(0, 4);
  const bettingMembers = memberList.filter((m) => m.name !== BETTING_EXCLUDED_NAME);
  const bettingMemberIds = new Set(bettingMembers.map((m) => m.id));

  const roundIdsByDate = new Map<number, Date>();
  for (const s of scores) {
    if (!roundIdsByDate.has(s.roundId)) {
      roundIdsByDate.set(s.roundId, s.round.date);
    }
  }
  const allRoundsWithAllThree = [...roundIdsByDate.entries()]
    .filter(([roundId]) => {
      const memberIdsInRound = new Set(
        scores.filter((s) => s.roundId === roundId).map((s) => s.memberId),
      );
      return [...bettingMemberIds].every((id) => memberIdsInRound.has(id));
    })
    .sort((a, b) => b[1].getTime() - a[1].getTime());

  function getWinnerForSlot(slotIndex: number): WinnerHistoryItem | null {
    if (allRoundsWithAllThree.length < slotIndex + 6) return null;
    const roundIds = allRoundsWithAllThree
      .slice(slotIndex, slotIndex + 6)
      .map(([id]) => id);
    const [newRoundId, ...baselineRoundIds] = roundIds;
    const improvements: {
      name: string;
      improvement: number;
      baselineAvg: number;
      currentStrokes: number;
    }[] = [];

    for (const member of members.filter((m) => bettingMemberIds.has(m.id))) {
      const baselineScores = scores.filter(
        (s) =>
          s.memberId === member.id && baselineRoundIds.includes(s.roundId),
      );
      const newScoreRow = scores.find(
        (s) => s.memberId === member.id && s.roundId === newRoundId,
      );
      if (baselineScores.length === 5 && newScoreRow) {
        const baselineSum = baselineScores.reduce((a, s) => a + s.strokes, 0);
        const baselineAvgInt = Math.trunc(baselineSum / 5);
        improvements.push({
          name: member.name,
          improvement: baselineAvgInt - newScoreRow.strokes,
          baselineAvg: baselineAvgInt,
          currentStrokes: newScoreRow.strokes,
        });
      }
    }

    if (improvements.length === 0) return null;
    const best = improvements.reduce((a, b) =>
      a.improvement >= b.improvement ? a : b,
    );
    const topWinners = improvements.filter((item) => item.improvement === best.improvement);
    const roundDate = roundIdsByDate.get(newRoundId);
    if (!roundDate) return null;

    return {
      winners: topWinners.map((w) => w.name),
      roundDate,
      memberDetails: improvements,
    };
  }

  const winnerHistory: WinnerHistoryItem[] = [];
  if (allRoundsWithAllThree.length >= 6) {
    for (let i = 0; i + 6 <= allRoundsWithAllThree.length; i++) {
      const item = getWinnerForSlot(i);
      if (item) winnerHistory.push(item);
    }
  }
  const totalPages = Math.max(1, Math.ceil(winnerHistory.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * ITEMS_PER_PAGE;
  const pagedHistory = winnerHistory.slice(start, start + ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/stats"
          className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
        >
          ← 평균 스코어
        </Link>
      </div>

      <section className="rounded-2xl border border-amber-700/60 bg-amber-950/40 px-4 py-3 shadow-lg">
        <h1 className="text-base font-semibold text-amber-100">역대 우승자</h1>
        <p className="mt-1 text-[11px] text-amber-200/90">
          부자되세요~ 멤버 3명 기준, 최근 경기의 우승 산정 내역
        </p>
      </section>

      {winnerHistory.length === 0 ? (
        <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-6">
          <p className="text-center text-xs text-emerald-200/85">
            역대 우승자를 계산할 데이터가 아직 부족합니다.
          </p>
        </section>
      ) : (
        <section className="space-y-2">
          {pagedHistory.map((entry, idx) => (
            <article
              key={`${entry.roundDate.toISOString()}-${entry.winners.join("|")}-${idx}`}
              className="rounded-2xl border border-amber-700/40 bg-emerald-950/75 px-4 py-3"
            >
              {(() => {
                const winnersKey = `${entry.roundDate.toISOString()}|${entry.winners
                  .slice()
                  .sort()
                  .join("|")}`;
                const isCommentOpen = activeCommentKey === winnersKey;
                return (
                  <>
              <p className="text-lg font-semibold text-amber-100">
                {start + idx + 1}.{" "}
                <Link
                  href={`/stats/winners?page=${safePage}&comment=${encodeURIComponent(winnersKey)}`}
                  className="underline decoration-amber-400/80 underline-offset-2 hover:text-amber-50"
                >
                  {entry.winners.join(" · ")}
                </Link>
                {entry.winners.length > 1 ? " (공동우승)" : ""}
              </p>
              <p className="mt-0.5 text-sm text-amber-200/90">
                경기일: {entry.roundDate.toLocaleDateString("ko-KR")}
              </p>

              <div className="mt-2 rounded-lg border border-emerald-800/60 bg-emerald-950/60 px-2.5 py-2">
                <p className="text-[10px] font-semibold text-emerald-200/90">
                  멤버별 상세 근거
                </p>
                <div className="mt-1.5 space-y-1">
                  {entry.memberDetails.map((member) => {
                    const isWinner = entry.winners.includes(member.name);
                    const avgShown = Math.trunc(member.baselineAvg);
                    const strokesShown = Math.trunc(member.currentStrokes);
                    const delta = avgShown - strokesShown;
                    const improvementLabel =
                      delta === 0
                        ? "변화 없음"
                        : delta > 0
                          ? `${delta}타 줄였어요~ 축하해요~`
                          : `${Math.abs(delta)}타 늘었네요~ 분발하세요~`;
                    return (
                    <p
                      key={`${entry.roundDate.toISOString()}-${member.name}`}
                      className={
                        isWinner
                          ? "text-[11px] font-semibold text-amber-200"
                          : "text-[11px] text-emerald-100/90"
                      }
                    >
                      {member.name}: 평균 {avgShown}타 → 이번 {strokesShown}타 (
                      {improvementLabel})
                    </p>
                    );
                  })}
                </div>
              </div>
              <WinnerComments
                winnersKey={winnersKey}
                roundDateIso={entry.roundDate.toISOString()}
                authorOptions={["익명", ...bettingMembers.map((m) => m.name)]}
                readOnly={!isCommentOpen}
              />
                  </>
                );
              })()}
            </article>
          ))}
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px]">
              <Link
                href={`/stats/winners?page=${Math.max(1, safePage - 1)}`}
                className={`rounded-full px-3 py-1 ${
                  safePage === 1
                    ? "pointer-events-none bg-emerald-900/40 text-emerald-400/50"
                    : "bg-emerald-800/70 text-emerald-100 hover:bg-emerald-700/80"
                }`}
              >
                이전
              </Link>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={`/stats/winners?page=${page}`}
                  className={`rounded-full px-2.5 py-1 ${
                    page === safePage
                      ? "bg-emerald-500 text-emerald-950"
                      : "bg-emerald-800/70 text-emerald-100 hover:bg-emerald-700/80"
                  }`}
                >
                  {page}
                </Link>
              ))}
              <Link
                href={`/stats/winners?page=${Math.min(totalPages, safePage + 1)}`}
                className={`rounded-full px-3 py-1 ${
                  safePage === totalPages
                    ? "pointer-events-none bg-emerald-900/40 text-emerald-400/50"
                    : "bg-emerald-800/70 text-emerald-100 hover:bg-emerald-700/80"
                }`}
              >
                다음
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
