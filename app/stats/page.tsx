import { prisma } from "@/lib/prisma";
import { StatsView } from "./StatsView";

const RECENT_ROUNDS = 5;
/** 부자되세요~ 5경기 평균에 쓸 멤버 (셋 다 포함된 라운드만 카운트) */
const BETTING_MEMBER_NAMES = ["김동원", "이문림", "신윤하"] as const;

export const revalidate = 0;

export default async function StatsPage() {
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
  const bettingMemberIds = new Set(
    memberList
      .filter((m) => (BETTING_MEMBER_NAMES as readonly string[]).includes(m.name))
      .map((m) => m.id),
  );

  // 세 명이 모두 참여한 라운드만 모아서, 최근 5경기 선정 (날짜 최신순)
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
  const roundsWithAllThree = allRoundsWithAllThree
    .slice(0, RECENT_ROUNDS)
    .map(([id]) => id);

  // 우승자: 가장 최근 라운드에서 최근 5경기 평균 대비 타수를 가장 많이 줄인 사람. 연속 우승도 계산.
  function getWinnerForSlot(slotIndex: number): string | null {
    if (allRoundsWithAllThree.length < slotIndex + 6) return null;
    const roundIds = allRoundsWithAllThree
      .slice(slotIndex, slotIndex + 6)
      .map(([id]) => id);
    const [newRoundId, ...baselineRoundIds] = roundIds;
    const improvements: { name: string; improvement: number }[] = [];
    for (const member of memberList) {
      if (!bettingMemberIds.has(member.id)) continue;
      const baselineScores = scores.filter(
        (s) =>
          s.memberId === member.id && baselineRoundIds.includes(s.roundId),
      );
      const newScoreRow = scores.find(
        (s) => s.memberId === member.id && s.roundId === newRoundId,
      );
      if (baselineScores.length === 5 && newScoreRow) {
        const baselineAvg =
          baselineScores.reduce((a, s) => a + s.strokes, 0) / 5;
        const improvement = baselineAvg - newScoreRow.strokes;
        improvements.push({ name: member.name, improvement });
      }
    }
    if (improvements.length === 0) return null;
    const best = improvements.reduce((a, b) =>
      a.improvement >= b.improvement ? a : b,
    );
    return best.improvement > 0 ? best.name : null;
  }

  let bettingWinner: string | null = null;
  let bettingStreak = 0;
  if (allRoundsWithAllThree.length >= 6) {
    const winners: (string | null)[] = [];
    for (let i = 0; i + 6 <= allRoundsWithAllThree.length; i++) {
      winners.push(getWinnerForSlot(i));
    }
    if (winners[0]) {
      bettingWinner = winners[0];
      let count = 0;
      for (const w of winners) {
        if (w === bettingWinner) count++;
        else break;
      }
      bettingStreak = count;
    }
  }

  const byMember = memberList.map((member) => {
    const memberScores = scores.filter((s) => s.memberId === member.id);
    const totalRounds = memberScores.length;
    const totalStrokes = memberScores.reduce((sum, s) => sum + s.strokes, 0);
    const avgAll =
      totalRounds > 0 ? totalStrokes / totalRounds : null;

    let avgRecent5: number | null = null;
    if (bettingMemberIds.has(member.id) && roundsWithAllThree.length > 0) {
      const strokesInSharedRounds = scores.filter(
        (s) =>
          s.memberId === member.id &&
          roundsWithAllThree.includes(s.roundId),
      );
      const sum = strokesInSharedRounds.reduce((a, s) => a + s.strokes, 0);
      avgRecent5 = sum / strokesInSharedRounds.length;
    }

    const bestStrokes =
      memberScores.length > 0
        ? Math.min(...memberScores.map((s) => s.strokes))
        : null;

    return {
      name: member.name,
      totalRounds,
      avgRecent5,
      avgAll,
      bestStrokes,
    };
  });

  // 연도별: 2025 ~ 현재 연도까지 오름차순. 년도가 바뀌면 새 연도 버튼 자동 추가
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: Math.max(0, currentYear - 2025 + 1) },
    (_, i) => 2025 + i,
  );

  const byYear: Record<number, { name: string; totalRounds: number; avgAll: number | null; bestStrokes: number | null }[]> = {};
  for (const year of years) {
    byYear[year] = memberList.map((member) => {
      const memberScoresInYear = scores.filter(
        (s) =>
          s.memberId === member.id &&
          new Date(s.round.date).getFullYear() === year,
      );
      const totalRounds = memberScoresInYear.length;
      const totalStrokes = memberScoresInYear.reduce((sum, s) => sum + s.strokes, 0);
      const avgAll = totalRounds > 0 ? totalStrokes / totalRounds : null;
      const bestStrokes =
        memberScoresInYear.length > 0
          ? Math.min(...memberScoresInYear.map((s) => s.strokes))
          : null;
      return {
        name: member.name,
        totalRounds,
        avgAll,
        bestStrokes,
      };
    });
  }

  // 코스별: 코스 이름별 라운드 수 + 멤버별 해당 코스 평균
  const roundsWithCourse = await prisma.round.findMany({
    include: { scores: { include: { member: true } } },
  });
  const courseNames = [...new Set(roundsWithCourse.map((r) => r.course || "코스 미지정"))].sort();
  const byCourse: { course: string; roundCount: number; members: { name: string; avg: number | null; rounds: number }[] }[] = courseNames.map((course) => {
    const courseRounds = roundsWithCourse.filter((r) => (r.course || "코스 미지정") === course);
    const roundCount = courseRounds.length;
    const roundIds = new Set(courseRounds.map((r) => r.id));
    const members = memberList.map((member) => {
      const memberScoresAtCourse = scores.filter(
        (s) => s.memberId === member.id && roundIds.has(s.roundId),
      );
      const n = memberScoresAtCourse.length;
      const avg = n > 0 ? memberScoresAtCourse.reduce((a, s) => a + s.strokes, 0) / n : null;
      return { name: member.name, avg, rounds: n };
    });
    return { course, roundCount, members };
  });

  return (
    <StatsView
      byMember={byMember}
      overallCount={scores.length}
      bettingRoundsCount={roundsWithAllThree.length}
      bettingWinner={bettingWinner}
      bettingStreak={bettingStreak}
      years={years}
      byYear={byYear}
      byCourse={byCourse}
    />
  );
}

