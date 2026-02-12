import path from "node:path";
import fs from "node:fs";

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

/** 업로드 루트가 public 밑인지(Next 정적 서빙 가능 여부) */
export function isUploadUnderPublic(): boolean {
  const root = getUploadRootDir();
  const publicUploads = path.join(process.cwd(), "public", "uploads");
  return path.normalize(root) === path.normalize(publicUploads);
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

/** 저장 루트의 절대 경로 (서버에서 파일 쓰기/읽기용) */
export function getUploadRootPath(): string {
  return getUploadRootDir();
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
 * 브라우저에서 접근할 URL (img src 등)
 * - public/uploads 사용 시: /uploads/상대경로
 * - UPLOAD_DIR 사용 시: /api/uploads/상대경로 (API 라우트로 서빙)
 */
export function getFileUrl(relativePath: string): string {
  const encoded = relativePath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  if (isUploadUnderPublic()) {
    return `/uploads/${encoded}`;
  }
  return `/api/uploads/${encoded}`;
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
