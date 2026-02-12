"use server";

import { prisma } from "@/lib/prisma";

export type CoursePar = {
  id: number;
  name: string;
  par1: number;
  par2: number;
  par3: number;
  par4: number;
  par5: number;
  par6: number;
  par7: number;
  par8: number;
  par9: number;
  par10: number;
  par11: number;
  par12: number;
  par13: number;
  par14: number;
  par15: number;
  par16: number;
  par17: number;
  par18: number;
};

export async function getCourses(): Promise<CoursePar[]> {
  const list = await prisma.course.findMany({
    orderBy: { name: "asc" },
  });
  return list.map((c) => ({
    id: c.id,
    name: c.name,
    par1: c.par1,
    par2: c.par2,
    par3: c.par3,
    par4: c.par4,
    par5: c.par5,
    par6: c.par6,
    par7: c.par7,
    par8: c.par8,
    par9: c.par9,
    par10: c.par10,
    par11: c.par11,
    par12: c.par12,
    par13: c.par13,
    par14: c.par14,
    par15: c.par15,
    par16: c.par16,
    par17: c.par17,
    par18: c.par18,
  }));
}

function parseParForm(formData: FormData): number[] {
  const arr: number[] = [];
  for (let i = 1; i <= 18; i++) {
    const raw = formData.get(`par${i}`) as string | null;
    const n = raw ? parseInt(raw, 10) : 4;
    arr.push(Number.isFinite(n) && n >= 3 && n <= 5 ? n : 4);
  }
  return arr;
}

export async function createCourse(formData: FormData): Promise<
  | { ok: true; course: CoursePar }
  | { ok: false; error: string }
> {
  const name = (formData.get("courseName") as string | null)?.trim() ?? "";
  if (!name) return { ok: false, error: "코스 이름을 입력해 주세요." };

  const pars = parseParForm(formData);
  const existing = await prisma.course.findUnique({ where: { name } });
  if (existing) return { ok: false, error: "이미 같은 이름의 코스가 있습니다." };

  const created = await prisma.course.create({
    data: {
      name,
      par1: pars[0],
      par2: pars[1],
      par3: pars[2],
      par4: pars[3],
      par5: pars[4],
      par6: pars[5],
      par7: pars[6],
      par8: pars[7],
      par9: pars[8],
      par10: pars[9],
      par11: pars[10],
      par12: pars[11],
      par13: pars[12],
      par14: pars[13],
      par15: pars[14],
      par16: pars[15],
      par17: pars[16],
      par18: pars[17],
    },
  });
  const course: CoursePar = {
    id: created.id,
    name: created.name,
    par1: created.par1, par2: created.par2, par3: created.par3, par4: created.par4, par5: created.par5,
    par6: created.par6, par7: created.par7, par8: created.par8, par9: created.par9,
    par10: created.par10, par11: created.par11, par12: created.par12, par13: created.par13, par14: created.par14,
    par15: created.par15, par16: created.par16, par17: created.par17, par18: created.par18,
  };
  return { ok: true, course };
}

export async function deleteCourse(courseId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.course.delete({ where: { id: courseId } });
    return { ok: true };
  } catch {
    return { ok: false, error: "삭제에 실패했습니다." };
  }
}

export async function getCourseByName(name: string): Promise<CoursePar | null> {
  const c = await prisma.course.findUnique({ where: { name } });
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    par1: c.par1, par2: c.par2, par3: c.par3, par4: c.par4, par5: c.par5,
    par6: c.par6, par7: c.par7, par8: c.par8, par9: c.par9,
    par10: c.par10, par11: c.par11, par12: c.par12, par13: c.par13, par14: c.par14,
    par15: c.par15, par16: c.par16, par17: c.par17, par18: c.par18,
  };
}
