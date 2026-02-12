import { prisma } from "@/lib/prisma";
import { getFileUrl } from "@/lib/uploadConfig";
import { GalleryClient } from "./GalleryClient";

export const revalidate = 0;

export default async function GalleryPage() {
  // Prisma 클라이언트에 GalleryItem이 없으면(마이그레이션·generate 미실행) 빈 배열 사용
  const model = (prisma as { galleryItem?: { findMany: (args: unknown) => Promise<{ id: number; title: string; description: string | null; filePath: string; createdAt: Date }[]> } }).galleryItem;
  const rows = model
    ? await model.findMany({ orderBy: { createdAt: "desc" } })
    : [];

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    filePath: r.filePath,
    imageUrl: getFileUrl(r.filePath),
    createdAt: r.createdAt.toISOString(),
  }));

  return <GalleryClient items={items} />;
}
