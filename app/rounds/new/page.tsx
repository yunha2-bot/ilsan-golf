import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveScorecardFile } from "@/lib/uploadConfig";
import { getCourses } from "@/app/actions/courses";
import { RoundFormFields } from "./RoundFormFields";

export const dynamic = "force-dynamic";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MEMBER_COUNT = 4;

function getParFromForm(formData: FormData): number[] {
  const arr: number[] = [];
  for (let i = 1; i <= 18; i++) {
    const raw = formData.get(`par${i}`) as string | null;
    const n = raw ? parseInt(raw, 10) : 4;
    arr.push(Number.isFinite(n) && n >= 3 && n <= 5 ? n : 4);
  }
  return arr;
}

async function createRound(formData: FormData) {
  "use server";

  const courseName = (formData.get("course") as string | null)?.trim() ?? "";
  const note = (formData.get("note") as string | null) ?? "";
  const roundDateStr = (formData.get("roundDate") as string | null) ?? "";

  if (!courseName?.trim() || courseName === "__new__") {
    return;
  }

  let roundDate: Date = new Date();
  if (roundDateStr) {
    const parsed = new Date(roundDateStr);
    if (!Number.isNaN(parsed.getTime())) {
      roundDate = parsed;
    }
  }

  let scorecardImagePath: string | null = null;
  const file = formData.get("scorecardImage");
  if (file instanceof Blob && file.size > 0 && ALLOWED_IMAGE.includes((file as File).type)) {
    const buffer = Buffer.from(await file.arrayBuffer());
    scorecardImagePath = saveScorecardFile(buffer, (file as File).name || "scorecard.jpg");
  }

  // 코스 파: DB에 있으면 사용, 없으면 폼의 par1~par18로 코스 생성 후 사용
  let parList: number[];
  const existingCourse = await prisma.course.findUnique({
    where: { name: courseName },
  });
  if (existingCourse) {
    parList = [
      existingCourse.par1, existingCourse.par2, existingCourse.par3, existingCourse.par4,
      existingCourse.par5, existingCourse.par6, existingCourse.par7, existingCourse.par8, existingCourse.par9,
      existingCourse.par10, existingCourse.par11, existingCourse.par12, existingCourse.par13, existingCourse.par14,
      existingCourse.par15, existingCourse.par16, existingCourse.par17, existingCourse.par18,
    ];
  } else {
    parList = getParFromForm(formData);
    await prisma.course.create({
      data: {
        name: courseName,
        par1: parList[0], par2: parList[1], par3: parList[2], par4: parList[3],
        par5: parList[4], par6: parList[5], par7: parList[6], par8: parList[7], par9: parList[8],
        par10: parList[9], par11: parList[10], par12: parList[11], par13: parList[12], par14: parList[13],
        par15: parList[14], par16: parList[15], par17: parList[16], par18: parList[17],
      },
    });
  }

  const round = await prisma.round.create({
    data: {
      date: roundDate,
      course: courseName,
      note,
      scorecardImagePath,
    },
  });

  for (let memberIdx = 0; memberIdx < MEMBER_COUNT; memberIdx++) {
    const memberIdRaw = formData.get(`memberId_${memberIdx}`);
    const memberId = typeof memberIdRaw === "string" ? parseInt(memberIdRaw, 10) : NaN;
    if (!Number.isFinite(memberId)) continue;

    const holes: number[] = [];
    for (let hole = 1; hole <= 18; hole++) {
      const raw = formData.get(`h${hole}_${memberIdx}`) as string | null;
      const val = raw ? parseInt(raw, 10) : 0;
      holes.push(Number.isNaN(val) ? 0 : val);
    }

    const allZero = holes.every((h) => h === 0);
    if (allZero) continue;

    const strokes = parList.reduce(
      (sum, par, i) => sum + par + (holes[i] ?? 0),
      0,
    );

    await prisma.score.create({
      data: {
        strokes,
        h1: holes[0],
        h2: holes[1],
        h3: holes[2],
        h4: holes[3],
        h5: holes[4],
        h6: holes[5],
        h7: holes[6],
        h8: holes[7],
        h9: holes[8],
        h10: holes[9],
        h11: holes[10],
        h12: holes[11],
        h13: holes[12],
        h14: holes[13],
        h15: holes[14],
        h16: holes[15],
        h17: holes[16],
        h18: holes[17],
        memberId,
        roundId: round.id,
      },
    });
  }

  redirect("/");
}

export default async function NewRoundPage() {
  const [members, courses] = await Promise.all([
    prisma.member.findMany({ orderBy: { id: "asc" } }),
    getCourses(),
  ]);
  const memberList = members.slice(0, 4);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 px-4 py-3 shadow-lg shadow-emerald-950/60">
        <p className="text-sm font-semibold text-emerald-50">
          새 라운드 기록
        </p>
        <p className="mt-1 text-[11px] text-emerald-200/85">
          코스를 풀다운에서 선택하세요. 새 코스는 「새 코스 추가」로 홀별 파를 입력해 DB에 저장한 뒤 선택할 수 있습니다.
        </p>
      </section>

      <form
        action={createRound}
        className="space-y-4 rounded-2xl border border-emerald-800/70 bg-emerald-950/80 px-4 py-4 shadow-lg shadow-emerald-950/70"
      >
        {memberList.map((m, i) => (
          <input key={m.id} type="hidden" name={`memberId_${i}`} value={m.id} />
        ))}
        <RoundFormFields
          members={memberList}
          courses={courses}
          defaultRoundDate={new Date().toISOString().slice(0, 10)}
        />

        <div className="pt-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-900/80 transition hover:bg-emerald-400"
          >
            라운드 저장하기
          </button>
        </div>
      </form>
    </div>
  );
}

