import { prisma } from "@/lib/prisma";
import { getFileUrl, getBaseUrlFromHeaders } from "@/lib/uploadConfig";
import { GalleryClient } from "./GalleryClient";

export const revalidate = 0;

export default async function GalleryPage(props: {
  searchParams?: Promise<{ roundId?: string; upload?: string }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const roundId = searchParams.roundId ? parseInt(searchParams.roundId, 10) || null : null;
  const autoOpenUpload = searchParams.upload === "1";

  const baseUrl = await getBaseUrlFromHeaders();

  const where = roundId ? { roundId } : {};
  const rows = await prisma.galleryItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    tags: r.tags,
    filePath: r.filePath,
    groupId: r.groupId,
    isCover: r.isCover,
    roundId: r.roundId,
    imageUrl: getFileUrl(r.filePath, baseUrl),
    createdAt: r.createdAt.toISOString(),
  }));

  let roundLabel: string | null = null;
  if (roundId) {
    const round = await prisma.round.findUnique({ where: { id: roundId } });
    roundLabel = round ? `Round #${round.id} · ${round.course}` : null;
  }

  return (
    <GalleryClient
      items={items}
      filterRoundId={roundId}
      filterRoundLabel={roundLabel}
      autoOpenUpload={autoOpenUpload}
    />
  );
}
