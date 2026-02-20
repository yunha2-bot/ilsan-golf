# Synology NAS에 일산골프모임 배포하기 (MariaDB)

Docker(Container Manager)와 **MariaDB**를 사용해 NAS에서 앱을 실행하는 방법입니다.

---

## 0. 배포 전 체크리스트

| 단계 | 확인 |
|------|------|
| 1 | NAS에 **Container Manager**, **MariaDB 10**, **phpMyAdmin** 설치됨 |
| 2 | phpMyAdmin에서 **DB** + **사용자** 생성 (예: `golf_db`, `golf_user`) |
| 3 | 프로젝트 **전체**를 NAS **docker/ilsan-golf** 폴더에 복사 (또는 Git 클론) |
| 4 | 프로젝트 폴더에 **`.env`** 파일 생성 후 `DATABASE_URL` 입력 (MariaDB 주소·비밀번호·DB명) |
| 5 | Container Manager에서 해당 폴더를 **프로젝트**로 불러와 **docker-compose**로 빌드·실행 |
| 6 | 브라우저에서 **http://NAS_IP:3001** 접속 |

**.env 없이** 빌드하면 DB 연결 오류로 앱이 동작하지 않습니다. 반드시 `.env`를 만든 뒤 배포하세요.

---

## 1. 준비

- **Synology NAS**에 **Container Manager**(또는 Docker) 패키지 설치
- **MariaDB 10** 패키지 설치 및 실행
- **phpMyAdmin** 설치 (DB·사용자 생성용)
- NAS와 같은 네트워크의 PC에서 프로젝트를 NAS로 복사하거나, NAS에서 Git으로 클론

---

## 2. MariaDB에 DB·사용자 만들기 (phpMyAdmin)

1. **phpMyAdmin** 접속 (예: `http://NAS_IP/phpMyAdmin` 또는 시놀로지 패키지에서 열기)
2. **사용자 계정**에서 새 사용자 추가:
   - 사용자 이름: 예) `golf_user`
   - 호스트 이름: `%` (모든 호스트) 또는 Docker용이면 `%` 권장
   - 비밀번호 설정
   - **데이터베이스**: "이름과 동일한 데이터베이스 생성" 체크 후 예) `golf_db`
   - 전역 권한: **모든 권한** 또는 최소한 `SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER`
3. **확인**으로 사용자와 DB 생성

연결 정보 정리:
- **호스트**: NAS IP (예: `192.168.0.10`) 또는 MariaDB가 같은 NAS에서 도는 경우 `host.docker.internal` 또는 NAS IP
- **포트**: `3306`
- **데이터베이스명**: `golf_db`
- **사용자명**: `golf_user`
- **비밀번호**: 위에서 설정한 값

---

## 3. 프로젝트 올리기

### 방법 A: 공유 폴더에 폴더 복사

1. NAS **File Station**에서 **docker** 공유 폴더로 이동
2. 그 안에 **ilsan-golf** 폴더 만들고, 이 프로젝트 **전체**를 복사  
   (필요: `app/`, `lib/`, `prisma/`, `public/`, `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `Dockerfile`, `docker-compose.yml`, `eslint.config.mjs` 등 루트 파일들)

### 방법 B: Git 사용 (NAS에 Git이 있다면)

```bash
# SSH로 NAS 접속 후
cd /volume1/docker
git clone <저장소_주소> ilsan-golf
cd ilsan-golf
```

---

## 4. 환경 변수 (.env) 설정

프로젝트 폴더에 **`.env`** 파일을 만들고 아래를 채웁니다.

```env
# 필수: MariaDB 연결 (phpMyAdmin에서 만든 DB·사용자 정보)
DATABASE_URL="mysql://golf_user:비밀번호@192.168.0.10:3306/golf_db"
```

- `192.168.0.10` → NAS IP로 변경 (MariaDB가 NAS에서 돌면 NAS IP 사용)
- `golf_user` / `비밀번호` / `golf_db` → phpMyAdmin에서 만든 사용자·비밀번호·DB 이름으로 변경

(선택) 나중에 비밀번호 로그인을 쓰려면 `.env`에 `GOLF_PASSWORD=원하는비밀번호` 추가

**Docker에서 NAS의 MariaDB 접속이 안 될 때**

- MariaDB 패키지가 “localhost”만 허용하면, 같은 NAS 안의 컨테이너에서는 `host.docker.internal`이 안 될 수 있습니다.  
  그럴 땐 **호스트를 NAS의 실제 IP**로 두고, MariaDB 설정에서 해당 IP(또는 Docker 네트워크) 접속을 허용하세요.

---

## 5. 경로 (업로드 사진)

- **DB**: MariaDB가 관리 (파일 볼륨 없음)
- **사진 업로드**: 프로젝트 폴더 안 **`uploads/`** 에 저장됩니다.  
  - Docker가 **`./uploads`** 를 컨테이너의 `/app/public/uploads`에 붙이므로, 갤러리·스코어카드 사진이 **NAS File Station**에서 `docker/ilsan-golf/uploads/년/월/일/` 안에 그대로 보입니다.
  - 컨테이너를 다시 만들어도 이 폴더는 NAS에 남아 있습니다.

---

## 6. 이미지 빌드 및 실행

### Container Manager (GUI)

1. **Container Manager** 실행
2. **프로젝트** → **생성** → **경로**에 프로젝트가 있는 폴더 선택 (예: `docker/ilsan-golf`)
3. **docker-compose.yml** 사용 선택 후 생성
4. 빌드가 끝나면 컨테이너가 자동으로 실행됨  
   (첫 실행 시 `npx prisma migrate deploy`로 MariaDB에 테이블 생성)

### SSH로 실행

```bash
cd /volume1/docker/ilsan-golf

# .env 반드시 준비 후
docker compose up -d --build

# 로그 확인
docker compose logs -f app
```

---

## 7. 접속

- 브라우저: **http://NAS_IP:3001**  
  예: `http://192.168.0.10:3001`  
  (docker-compose에서 포트를 3001로 설정해 두었습니다. 3000 포트 충돌 시 사용)
- 같은 Wi‑Fi/랜에 있는 휴대폰에서도 `http://NAS_IP:3001`로 접속 가능

---

## 8. 데이터 보관

- **DB**: MariaDB에 저장 (phpMyAdmin으로 백업·복원 가능)
- **사진**: 프로젝트 폴더의 **`uploads/`** (갤러리, 스코어카드). File Station에서 `docker/ilsan-golf/uploads` 로 확인 가능.

컨테이너를 지우거나 다시 빌드해도 DB는 MariaDB에, 사진은 `uploads/` 폴더에 유지됩니다.

---

## 9. 업데이트

코드만 바꾸고 다시 빌드·재시작:

```bash
cd /volume1/docker/ilsan-golf
docker compose up -d --build
```

---

## 10. 문제 해결

| 현상 | 확인 사항 |
|------|------------|
| 접속 안 됨 | 방화벽에서 3001 포트 허용, `docker compose logs app` 로 에러 확인 |
| external connectivity 오류 | 3000 포트가 이미 사용 중일 수 있음. docker-compose.yml에서 `3001:3000`으로 설정해 두었으므로 3001로 접속. 3000을 쓰려면 해당 포트를 쓰는 컨테이너/앱을 중지 후 재시작 |
| DB 연결 오류 | `.env`의 `DATABASE_URL` 형식: `mysql://사용자:비밀번호@호스트:3306/DB이름`, MariaDB가 3306에서 실행 중인지, 사용자 권한 확인 (phpMyAdmin에서 테스트) |
| 마이그레이션 실패 | phpMyAdmin으로 해당 DB에 접속 가능한지, 사용자에게 DB 권한(CREATE, ALTER 등) 있는지 확인 |
| 사진 안 보임 / uploads에 안 남음 | `docker-compose.yml`에 `./uploads:/app/public/uploads` 볼륨이 있는지 확인. NAS에서는 프로젝트 폴더(docker/ilsan-golf) 안에 `uploads` 폴더가 생기며, 업로드 시 그 안에 년/월/일 폴더가 만들어짐 |

빌드 실패 시:

```bash
docker compose build --no-cache
docker compose up -d
```

이후에도 오류가 나면 터미널/Container Manager 로그의 에러 메시지를 확인하면 됩니다.
