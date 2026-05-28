import { prisma } from "@/lib/prisma";
import { StatsView } from "./StatsView";

const RECENT_ROUNDS = 5;
/** 부자되세요~: 이 이름의 멤버만 제외한 3명 (나머지가 참가 대상). 이름으로 지정해 DB 순서와 무관하게 동작 */
const BETTING_EXCLUDED_NAME = "김상우";
type BettingWinnerHistoryItem = {
  winners: string[];
  roundDate: string;
};

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
  function getWinnerForSlot(slotIndex: number): BettingWinnerHistoryItem | null {
    if (allRoundsWithAllThree.length < slotIndex + 6) return null;
    const roundIds = allRoundsWithAllThree
      .slice(slotIndex, slotIndex + 6)
      .map(([id]) => id);
    const [newRoundId, ...baselineRoundIds] = roundIds;
    const improvements: {
      name: string;
      improvement: number;
      baselineAvg: number;
      winnerStrokes: number;
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
        const improvement = baselineAvgInt - newScoreRow.strokes;
        improvements.push({
          name: member.name,
          improvement,
          baselineAvg: baselineAvgInt,
          winnerStrokes: newScoreRow.strokes,
        });
      }
    }
    if (improvements.length === 0) return null;
    const best = improvements.reduce((a, b) =>
      a.improvement >= b.improvement ? a : b,
    );
    const topWinners = improvements.filter(
      (item) => item.improvement === best.improvement,
    );
    const roundDate = roundIdsByDate.get(newRoundId);
    if (!roundDate) return null;
    return {
      winners: topWinners.map((w) => w.name),
      roundDate: roundDate.toISOString(),
    };
  }

  let bettingWinner: string | null = null;
  let bettingStreak = 0;
  let bettingLatestLowest: string | null = null; // 평균 대비 우승 없을 때 이번 경기 최저 타수 1등
  let latestWinnerNames: string[] = [];
  let latestWinnerRoundDate: string | null = null;
  if (allRoundsWithAllThree.length >= 6) {
    const winners: (BettingWinnerHistoryItem | null)[] = [];
    for (let i = 0; i + 6 <= allRoundsWithAllThree.length; i++) {
      winners.push(getWinnerForSlot(i));
    }
    if (winners[0]?.winners.length) {
      bettingWinner = winners[0].winners.join(" · ");
      latestWinnerNames = winners[0].winners;
      latestWinnerRoundDate = winners[0].roundDate;
      const firstKey = winners[0].winners.slice().sort().join("|");
      let count = 0;
      for (const w of winners) {
        const key = w?.winners.slice().sort().join("|");
        if (key && key === firstKey) count++;
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

  // 분포 통계: 멤버별 홀 타입 카운트
  type DistCounts = { eagle: number; birdie: number; par: number; bogey: number; double: number; triple: number };
  const scoreDistribution = memberList.map((member) => {
    const memberScores = scores.filter((s) => s.memberId === member.id);
    const counts: DistCounts = { eagle: 0, birdie: 0, par: 0, bogey: 0, double: 0, triple: 0 };
    let totalHoles = 0;
    for (const s of memberScores) {
      const holes = [s.h1,s.h2,s.h3,s.h4,s.h5,s.h6,s.h7,s.h8,s.h9,s.h10,s.h11,s.h12,s.h13,s.h14,s.h15,s.h16,s.h17,s.h18];
      for (const h of holes) {
        totalHoles++;
        if (h <= -2) counts.eagle++;
        else if (h === -1) counts.birdie++;
        else if (h === 0) counts.par++;
        else if (h === 1) counts.bogey++;
        else if (h === 2) counts.double++;
        else counts.triple++;
      }
    }
    return { id: member.id, name: member.name, counts, totalHoles };
  });

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
    const recent5Scores = roundsWithAllThree
      .map((roundId) => scores.find((s) => s.memberId === member.id && s.roundId === roundId)?.strokes)
      .filter((n): n is number => n != null);
    return {
      id: member.id,
      name: base.name,
      totalRounds: allRoundsWithAllThree.length,
      avgRecent5: base.avgRecent5,
      avgAll: base.avgAll,
      bestStrokes: bestStrokesInBetting,
      recent5Scores: recent5Scores.length > 0 ? recent5Scores : undefined,
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
  const byCourse: { course: string; roundCount: number; members: { name: string; avg: number | null; rounds: number; best: number | null }[] }[] = courseNames.map((course) => {
    const courseRounds = roundsWithCourse.filter((r) => (r.course || "코스 미지정") === course);
    const roundCount = courseRounds.length;
    const roundIds = new Set(courseRounds.map((r) => r.id));
    const members = memberList.map((member) => {
      const memberScoresAtCourse = scores.filter(
        (s) => s.memberId === member.id && roundIds.has(s.roundId),
      );
      const n = memberScoresAtCourse.length;
      const avg = n > 0 ? memberScoresAtCourse.reduce((a, s) => a + s.strokes, 0) / n : null;
      const best = n > 0 ? Math.min(...memberScoresAtCourse.map((s) => s.strokes)) : null;
      return { name: member.name, avg, rounds: n, best };
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
      latestWinnerNames={latestWinnerNames}
      latestWinnerRoundDate={latestWinnerRoundDate}
      years={years}
      byYear={byYear}
      byCourse={byCourse}
      scoreDistribution={scoreDistribution}
    />
  );
}

