import path from "node:path";
import fs from "node:fs";
import { headers } from "next/headers";

/**
 * 업로드 파일 저장 루트 디렉터리.
 * - 미설정: 프로젝트 내 public/uploads (Next 정적 서빙 /uploads/...)
 * - 시놀로지 NAS 등: .env에 UPLOAD_DIR 절대 경로 지정 (예: /volume1/docker/golf/uploads)
 *   → 이 경우 파일은 /api/uploads/... 로 서빙됨
 */
function getUploadRootDir(): string {
  const env = process.env.UPLOAD_DIR;
  if (env && path.isAbsolute(env)) {
    return path.normalize(env);
  }
  return path.join(process.cwd(), "public", "uploads");
}

/**
 * 저장 시 사용할 디렉터리 절대 경로 (년/월/일 서브디렉터리 생성용)
 * 예: .../uploads/2025/02/11
 */
export function getUploadDirForDate(date: Date): string {
  const root = getUploadRootDir();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return path.join(root, String(y), m, d);
}

/**
 * DB에 저장할 상대 경로 생성 (년/월/일/파일명)
 * URL 경로와 동일하게 사용 (슬래시 구분자)
 */
export function getRelativePath(filename: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}/${filename}`;
}

/** 상대 경로 → 서버 디스크 절대 경로 */
export function resolveAbsolutePath(relativePath: string): string {
  const root = getUploadRootDir();
  const normalized = relativePath.replace(/\//g, path.sep);
  return path.join(root, normalized);
}

/**
 * 요청 헤더에서 절대 URL 베이스 추출 (리버스 프록시 시 호스트/프로토콜 반영)
 * NEXT_PUBLIC_APP_URL 없을 때 사용. async이므로 서버 컴포넌트에서 await 호출.
 */
export async function getBaseUrlFromHeaders(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env && env.trim()) return env.replace(/\/$/, "").trim();
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto");
    if (host) {
      const scheme = proto === "https" || proto === "on" ? "https" : "http";
      return `${scheme}://${host}`;
    }
  } catch {
    // API 등에서 headers() 없을 수 있음
  }
  return "";
}

/**
 * 브라우저에서 접근할 URL (img src 등)
 * baseUrl 이 있으면 절대 URL, 없으면 NEXT_PUBLIC_APP_URL, 둘 다 없으면 상대 경로
 */
export function getFileUrl(relativePath: string, baseUrl?: string): string {
  const encoded = relativePath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  const pathPart = `/api/uploads/${encoded}`;
  const origin = baseUrl ?? (process.env.NEXT_PUBLIC_APP_URL?.trim() ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "").trim() : "");
  return origin ? `${origin}${pathPart}` : pathPart;
}

/** 업로드 루트 및 날짜별 디렉터리 생성 (없으면) */
export function ensureUploadDirs(dirForDate: string): void {
  if (!fs.existsSync(dirForDate)) {
    fs.mkdirSync(dirForDate, { recursive: true });
  }
}

// --- 스코어카드 전용 (scorecards/년/월/일/파일명) ---

export function getScorecardDirForDate(date: Date): string {
  const root = getUploadRootDir();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return path.join(root, "scorecards", String(y), m, d);
}

/** 스코어카드 상대 경로 (DB 저장·URL용) */
export function getScorecardRelativePath(filename: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `scorecards/${y}/${m}/${d}/${filename}`;
}

function safeScorecardFilename(original: string): string {
  const ext = path.extname(original) || ".jpg";
  const base = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return base + ext.toLowerCase();
}

/**
 * 스코어카드 이미지 저장 (서버 액션에서 호출).
 * buffer를 저장하고 상대 경로 반환.
 */
export function saveScorecardFile(buffer: Buffer, originalFilename: string): string {
  const dir = getScorecardDirForDate(new Date());
  ensureUploadDirs(dir);
  const filename = safeScorecardFilename(originalFilename);
  const absolutePath = path.join(dir, filename);
  fs.writeFileSync(absolutePath, buffer);
  return getScorecardRelativePath(filename);
}
