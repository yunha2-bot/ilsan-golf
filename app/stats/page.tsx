import { prisma } from "@/lib/prisma";
import { StatsView } from "./StatsView";

const RECENT_ROUNDS = 5;
/** 부자되세요~: 이 이름의 멤버만 제외한 3명 (나머지가 참가 대상). 이름으로 지정해 DB 순서와 무관하게 동작 */
const BETTING_EXCLUDED_NAME = "김상우";

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
  const bettingMembers = memberList.filter((m) => m.name !== BETTING_EXCLUDED_NAME);
  const bettingMemberIds = new Set(bettingMembers.map((m) => m.id));

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
    for (const member of members.filter((m) => bettingMemberIds.has(m.id))) {
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
  let bettingLatestLowest: string | null = null; // 평균 대비 우승 없을 때 이번 경기 최저 타수 1등
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
  // 평균 대비 우승자가 없을 때: 이번 경기(가장 최근) 최저 타수인 사람을 이번 경기 1등으로 표시
  if (!bettingWinner && allRoundsWithAllThree.length >= 1) {
    const [latestRoundId] = allRoundsWithAllThree[0];
    const scoresInLatest = scores.filter(
      (s) => s.roundId === latestRoundId && bettingMemberIds.has(s.memberId),
    );
    if (scoresInLatest.length > 0) {
      const lowest = scoresInLatest.reduce((a, b) =>
        a.strokes <= b.strokes ? a : b,
      );
      bettingLatestLowest = lowest.member.name;
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
      id: member.id,
      name: member.name,
      totalRounds,
      avgRecent5,
      avgAll,
      bestStrokes,
    };
  });

  const allRoundIdsWithThree = new Set(
    allRoundsWithAllThree.map(([id]) => id),
  );
  const bettingByMember = bettingMembers.map((member) => {
    const base = byMember.find((b) => b.name === member.name)!;
    const scoresInBettingRounds = scores.filter(
      (s) =>
        s.memberId === member.id && allRoundIdsWithThree.has(s.roundId),
    );
    const bestStrokesInBetting =
      scoresInBettingRounds.length > 0
        ? Math.min(...scoresInBettingRounds.map((s) => s.strokes))
        : null;
    return {
      id: member.id,
      name: base.name,
      totalRounds: allRoundsWithAllThree.length,
      avgRecent5: base.avgRecent5,
      avgAll: base.avgAll,
      bestStrokes: bestStrokesInBetting,
    };
  });

  // 연도별: 2025 ~ 현재 연도까지 오름차순. 년도가 바뀌면 새 연도 버튼 자동 추가
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: Math.max(0, currentYear - 2025 + 1) },
    (_, i) => 2025 + i,
  );

  const byYear: Record<number, { id: number; name: string; totalRounds: number; avgAll: number | null; bestStrokes: number | null }[]> = {};
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
        id: member.id,
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
      bettingByMember={bettingByMember}
      overallCount={scores.length}
      bettingRoundsCount={roundsWithAllThree.length}
      bettingWinner={bettingWinner}
      bettingStreak={bettingStreak}
      bettingLatestLowest={bettingLatestLowest}
      years={years}
      byYear={byYear}
      byCourse={byCourse}
    />
  );
}

