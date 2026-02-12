"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateMemberName(memberId: number, newName: string) {
  const name = newName.trim();
  if (!name) return { ok: false, error: "이름을 입력해 주세요." };

  const existing = await prisma.member.findUnique({
    where: { id: memberId },
  });
  if (!existing) return { ok: false, error: "멤버를 찾을 수 없습니다." };

  const duplicate = await prisma.member.findUnique({
    where: { name },
  });
  if (duplicate && duplicate.id !== memberId) {
    return { ok: false, error: "이미 사용 중인 이름입니다." };
  }

  await prisma.member.update({
    where: { id: memberId },
    data: { name },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
