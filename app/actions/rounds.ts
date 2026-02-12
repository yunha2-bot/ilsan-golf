"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function deleteRound(roundId: number) {
  await prisma.score.deleteMany({ where: { roundId } });
  await prisma.round.delete({ where: { id: roundId } });
  revalidatePath("/", "layout");
  redirect("/");
}
