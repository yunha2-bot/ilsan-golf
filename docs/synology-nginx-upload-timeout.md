# 시놀로지 역방향 프록시 / Nginx – 업로드·타임아웃 설정 가이드

갤러리처럼 **큰 파일 업로드**나 **오래 걸리는 요청**을 쓰려면, 프록시에서 **최대 요청 크기**와 **타임아웃**을 키워야 합니다.

---

## 1. 왜 필요한가?

| 현상 | 원인 |
|------|------|
| **413 Request Entity Too Large** | 업로드 파일 크기가 Nginx 기본값(보통 1MB)을 넘음 |
| **502 Bad Gateway** / 중간에 끊김 | 업로드·처리 시간이 `proxy_read_timeout`(보통 60초)을 넘음 |

그래서 다음 두 가지를 키워야 합니다.

- **client_max_body_size** – 허용하는 요청 본문(업로드) 최대 크기 (예: 50M)
- **proxy_read_timeout** (필요 시 **proxy_send_timeout**, **client_body_timeout**) – 대기 시간(초)

---

## 2. 시놀로지 DSM 역방향 프록시 (SSH로 Nginx 설정 수정)

DSM **제어판 → 로그인 포털 → 고급 → 역방향 프록시**로 쓰는 Nginx는 **템플릿에서 생성된 설정**을 쓰기 때문에, **SSH로 들어가서 해당 Nginx 설정을 수정**해야 합니다.

### 2.1 SSH 접속

1. **제어판 → 터미널 및 SNMP** 에서 **SSH 서비스 활성화**
2. PC에서 SSH로 접속 (예: `ssh admin@NAS_IP`)
3. 필요 시 `sudo -i` 로 root

### 2.2 Nginx 설정 파일 위치 (DSM 7 기준)

역방향 프록시용 설정은 보통 다음처럼 생성됩니다.

- **템플릿**: `/usr/syno/share/nginx/nginx.mustache`
- **실제 사용하는 설정**: `/usr/syno/etc/nginx/` 아래 (예: `server.ReverseProxy.conf` 등)

DSM 버전에 따라 경로가 다를 수 있으니, 먼저 확인합니다.

```bash
# 역방향 프록시 관련 설정 파일 찾기
sudo find /usr/syno -name "*.conf" -path "*nginx*" 2>/dev/null
sudo ls -la /usr/syno/etc/nginx/
```

`nginx.mustache`를 수정하면 재생성 시 반영되므로, **반드시 백업 후** 수정합니다.

### 2.3 백업 후 client_max_body_size / 타임아웃 추가

```bash
# 백업 (날짜 붙여서)
sudo cp /usr/syno/share/nginx/nginx.mustache /usr/syno/share/nginx/nginx.mustache.bak-$(date +%Y%m%d)

# 편집 (vi 말고 nano 쓰려면: sudo nano ...)
sudo vi /usr/syno/share/nginx/nginx.mustache
```

**http 블록 안** (맨 위 `http {` 다음 근처), `error_log` 아래처럼 넣습니다.

```nginx
# 업로드 최대 크기 (50MB, 이미지 여러 장 + 동영상 고려)
client_max_body_size 50m;

# 클라이언트가 본문 보내는 동안 기다리는 시간 (업로드 느릴 때)
client_body_timeout 300s;

# upstream(Next.js 등) 응답 기다리는 시간
proxy_read_timeout 300s;
proxy_send_timeout 300s;
proxy_connect_timeout 60s;
```

- **300초(5분)** 가 길면 120~180 정도로 줄여도 됩니다.
- **50m** 은 50MB. 동영상이 더 크면 `100m` 등으로 올리면 됩니다.

저장 후 **Nginx 재로드** (DSM에 맞는 방법 사용):

```bash
# 방법 1: reload
sudo nginx -s reload

# 방법 2: DSM이 스크립트로 제어하는 경우
sudo synoservicecfg --reload nginx
# 또는
sudo systemctl reload nginx
```

### 2.4 역방향 프록시만 적용하고 싶을 때 (가능한 경우)

DSM이 **역방향 프록시용 server 블록**을 별도 파일로 두는 경우, 그 파일만 수정할 수 있습니다.  
위에서 찾은 `server.*.conf` 중 역방향 프록시용인 것을 열어서, **해당 server 블록 안**에만 넣습니다.

```nginx
server {
    # ... 기존 설정 ...

    client_max_body_size 50m;
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    location / {
        proxy_pass http://...
        # ...
    }
}
```

이렇게 하면 해당 호스트(golf.yoonha.synology.me 등)에만 적용됩니다.

### 2.5 DSM 업데이트 시 주의

- **DSM 업데이트나 Nginx 관련 패키지 업데이트** 시 `nginx.mustache` 등이 **다시 덮어씌워질 수 있습니다.**
- 설정 수정 후 **백업본(nginx.mustache.bak-날짜)** 을 꼭 두고, 업데이트 후에 다시 적용이 필요한지 확인하는 것이 좋습니다.
- 가능하면 **user.conf / include로 분리**하는 방식(아래 4절 참고)을 찾아서 쓰면 유지보수가 쉽습니다.

---

## 3. 일반 Nginx (시놀로지 아님, 단독 Nginx)

Nginx를 직접 설치해 쓰는 경우(우분투, Docker 등) 예시는 아래와 같습니다.

### 3.1 전역 (http 블록)

`/etc/nginx/nginx.conf` 의 `http { ... }` 안:

```nginx
http {
    # ... 기존 설정 ...

    client_max_body_size 50m;
    client_body_timeout 300s;
    # proxy 관련은 보통 server / location 안에서 설정
}
```

### 3.2 역방향 프록시 server 블록 (권장)

특정 도메인(예: golf.yoonha.synology.me)에만 적용하려면 해당 `server` 블록에 넣습니다.

```nginx
server {
    listen 443 ssl;
    server_name golf.yoonha.synology.me;

    # 업로드 허용 크기 (50MB)
    client_max_body_size 50m;
    # 클라이언트가 본문 보내는 데 걸리는 시간
    client_body_timeout 300s;

    location / {
        proxy_pass http://127.0.0.1:3000;   # Next.js 등
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 업스트림(Next.js) 응답 대기 시간 – 업로드·처리 시간이 길 때 필수
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        proxy_connect_timeout 60s;

        # 버퍼 (큰 요청/응답 시 도움)
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
```

설정 검사 후 재로드:

```bash
sudo nginx -t
sudo nginx -s reload
```

---

## 4. 지시어 설명 요약

| 지시어 | 의미 | 추천 예시 |
|--------|------|-----------|
| **client_max_body_size** | 클라이언트가 보낼 수 있는 요청 본문(파일 업로드 포함) 최대 크기 | `50m` (50MB) |
| **client_body_timeout** | 클라이언트가 요청 본문을 보내는 동안 서버가 기다리는 시간 | `300s` (5분) |
| **proxy_read_timeout** | 프록시가 **백엔드(Next.js) 응답**을 기다리는 시간 | `300s` |
| **proxy_send_timeout** | 프록시가 **백엔드로 요청을 보내는** 데 허용하는 시간 | `300s` |
| **proxy_connect_timeout** | 백엔드와 **연결**을 맺는 데 걸리는 시간 | `60s` |

업로드가 “느리다”는 경우에는 **client_body_timeout**, **proxy_read_timeout**, **proxy_send_timeout**을 함께 늘리는 것이 중요합니다.

---

## 5. 적용 후 확인

1. 브라우저에서 **갤러리에서 10MB 이하 이미지 여러 장** 업로드 → 413이 사라지고 정상 업로드되는지 확인.
2. **한두 장 올렸을 때 중간에 끊기던 현상**이 있으면, 타임아웃을 300초로 둔 뒤 다시 테스트.
3. 문제가 있으면 브라우저 개발자 도구 **네트워크** 탭에서 실패한 요청의 **상태 코드(413/502)** 와 **응답 본문**을 확인하면 원인 파악에 도움이 됩니다.

이 가이드는 **시놀로지 역방향 프록시**와 **일반 Nginx** 모두에 맞춰, `client_max_body_size`와 `proxy_read_timeout` 등을 키우는 방법을 자세히 설명한 것입니다.
