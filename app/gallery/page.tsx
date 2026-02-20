import { prisma } from "@/lib/prisma";
import { getFileUrl } from "@/lib/uploadConfig";
import { GalleryClient } from "./GalleryClient";

export const revalidate = 0;

export default async function GalleryPage() {
  // Prisma 클라이언트에 GalleryItem이 없으면(마이그레이션·generate 미실행) 빈 배열 사용
  const rows = await prisma.galleryItem.findMany({
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
    imageUrl: getFileUrl(r.filePath),
    createdAt: r.createdAt.toISOString(),
  }));

  return <GalleryClient items={items} />;
}
