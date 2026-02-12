# Synology NAS에 일산골프모임 배포하기

Docker(Container Manager)를 사용해 NAS에서 앱을 실행하는 방법입니다.

---

## 1. 준비

- **Synology NAS**에서 **Container Manager**(또는 Docker) 패키지 설치
- NAS와 같은 네트워크의 PC에서 프로젝트를 NAS로 복사하거나, NAS에서 Git으로 클론

---

## 2. 프로젝트 올리기

### 방법 A: 공유 폴더에 폴더 복사

1. NAS **File Station**에서 공유 폴더 하나 정하기 (예: `docker`)
2. 그 안에 `golf` 폴더 만들고, 이 프로젝트 **전체**를 복사  
   (최소 필요: `app/`, `lib/`, `prisma/`, `public/`, `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `Dockerfile`, `docker-compose.yml`, `eslint.config.mjs` 등 루트 파일들)

### 방법 B: Git 사용 (NAS에 Git이 있다면)

```bash
# SSH로 NAS 접속 후
cd /volume1/docker   # 원하는 경로로 변경
git clone <저장소 주소> golf
cd golf
```

---

## 3. 경로 (고정)

`docker-compose.yml`에서 다음 경로를 사용합니다.

- **DB (SQLite)**: `file:/app/data/golf.db` → 볼륨 `golf-db`가 `/app/data`에 마운트됨
- **사진 업로드**: `/app/public/uploads` → 볼륨 `golf-uploads`가 `/app/public/uploads`에 마운트됨

NAS 공유 폴더에 직접 두고 싶다면 `volumes`만 바꾸면 됩니다.

**예: NAS 경로에 직접 저장**

```yaml
volumes:
  - /volume1/docker/golf/data:/app/data
  - /volume1/docker/golf/uploads:/app/public/uploads
```

---

## 4. 이미지 빌드 및 실행

### Container Manager (GUI)

1. **Container Manager** 실행
2. **프로젝트** → **생성** → **경로**에 프로젝트가 있는 폴더 선택 (예: `/docker/golf`)
3. **docker-compose.yml** 사용 선택 후 생성
4. 빌드가 끝나면 컨테이너가 자동으로 실행됨

### SSH로 실행

```bash
cd /volume1/docker/golf   # 실제 경로로 변경

# 빌드 후 백그라운드 실행
docker compose up -d --build

# 로그 확인
docker compose logs -f app
```

---

## 5. 접속

- 브라우저: **http://NAS_IP:3000**  
  예: `http://192.168.0.10:3000`
- 같은 Wi‑Fi/랜에 있는 휴대폰에서도 `http://NAS_IP:3000`으로 접속 가능

---

## 6. 데이터 보관 위치

- **DB**: `file:/app/data/golf.db` → 볼륨 `golf-db` (또는 NAS 마운트 경로)
- **사진**: `/app/public/uploads` → 볼륨 `golf-uploads` (갤러리, 스코어카드)

볼륨을 쓰므로 컨테이너를 지우거나 다시 빌드해도 DB와 사진은 유지됩니다.

---

## 7. 업데이트

코드만 바꾸고 다시 빌드·재시작:

```bash
cd /volume1/docker/golf
docker compose up -d --build
```

---

## 8. 문제 해결

| 현상 | 확인 사항 |
|------|-----------|
| 접속 안 됨 | 방화벽에서 3000 포트 허용, `docker compose logs app` 로 에러 확인 |
| DB 오류 | `DATABASE_URL`이 `file:/app/data/golf.db`인지, 볼륨 `golf-db`가 `/app/data`에 마운트됐는지 확인 |
| 사진 안 보임 | `UPLOAD_DIR=/app/public/uploads`이고, 볼륨 `golf-uploads`가 `/app/public/uploads`에 마운트됐는지 확인 |

빌드 실패 시:

```bash
docker compose build --no-cache
docker compose up -d
```

이후에도 오류가 나면 터미널/Container Manager 로그의 에러 메시지를 확인하면 됩니다.
