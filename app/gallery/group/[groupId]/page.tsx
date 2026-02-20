import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getFileUrl } from "@/lib/uploadConfig";
import { GalleryGroupClient } from "../GalleryGroupClient";

export const revalidate = 0;

type Props = { params: Promise<{ groupId: string }> };

export default async function GalleryGroupPage({ params }: Props) {
  const { groupId } = await params;
  const decoded = decodeURIComponent(groupId);

  let items: { id: number; title: string; description: string | null; tags: string; filePath: string; groupId: string | null; isCover: boolean; createdAt: Date }[];

  if (decoded.startsWith("single-")) {
    const id = Number(decoded.replace("single-", ""));
    if (!Number.isInteger(id) || id < 1) {
      return (
        <div className="p-4">
          <p className="text-red-300">잘못된 경로입니다.</p>
          <Link href="/gallery" className="text-emerald-400 underline mt-2 inline-block">
            갤러리로 돌아가기
          </Link>
        </div>
      );
    }
    const one = await prisma.galleryItem.findUnique({ where: { id } });
    items = one ? [one] : [];
  } else {
    items = await prisma.galleryItem.findMany({
      where: { groupId: decoded },
      orderBy: { id: "asc" },
    });
  }

  const list = items.map((r) => ({
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

  if (list.length === 0) {
    return (
      <div className="p-4">
        <p className="text-emerald-200">해당 게시글을 찾을 수 없습니다.</p>
        <Link href="/gallery" className="text-emerald-400 underline mt-2 inline-block">
          갤러리로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/gallery"
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-800/60"
        >
          ← 갤러리
        </Link>
        <span className="text-[11px] text-emerald-300/80">
          {list.length}장
        </span>
      </div>
      <GalleryGroupClient items={list} />
    </div>
  );
}
