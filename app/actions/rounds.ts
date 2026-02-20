"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/** 삭제 비밀번호 확인 후 라운드 삭제. GOLF_DELETE_PASSWORD 또는 GOLF_PASSWORD 사용 */
export async function deleteRoundWithPassword(
  roundId: number,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const expected =
    process.env.GOLF_DELETE_PASSWORD ?? process.env.GOLF_PASSWORD ?? "";
  if (expected && password !== expected) {
    return { ok: false, error: "비밀번호가 올바르지 않습니다." };
  }
  await prisma.score.deleteMany({ where: { roundId } });
  await prisma.round.delete({ where: { id: roundId } });
  revalidatePath("/", "layout");
  redirect("/");
}
