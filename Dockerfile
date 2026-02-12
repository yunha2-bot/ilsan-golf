# ========== 1. 빌드 단계 ==========
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# ========== 2. 실행 단계 (standalone) ==========
FROM node:20-alpine AS run

WORKDIR /app

# Next.js standalone 출력 복사
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# DB 마이그레이션용 (스키마 + 마이그레이션 파일)
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
RUN npm install prisma@5.22.0 --no-save

ENV NODE_ENV=production
EXPOSE 3000

# DB·업로드 디렉터리 생성 → 마이그레이션 → 서버 시작
CMD ["sh", "-c", "mkdir -p /app/data /app/public/uploads && npx prisma migrate deploy && node server.js"]
