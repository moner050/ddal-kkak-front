# Mixed Content 및 504 Timeout 해결 가이드

## 🔍 문제 진단

### 발견된 문제들

1. **Mixed Content Error** (보안 문제)
   ```
   Mixed Content: The page at 'https://www.ddalkkak.kro.kr/' was loaded over HTTPS,
   but requested an insecure XMLHttpRequest endpoint 'http://finance-mhb-api.kro.kr/...'
   ```
   - 원인: HTTPS 사이트에서 HTTP API를 호출하려고 함
   - 브라우저가 보안상의 이유로 차단

2. **504 Gateway Timeout** (정적 파일 로딩)
   ```
   GET https://www.ddalkkak.kro.kr/data/undervalued-stocks/2025-11-25.json 504
   ```
   - 원인: 정적 JSON 파일 로딩 시 타임아웃 발생
   - Nginx 타임아웃 또는 파일 서빙 문제

---

## 🚀 해결 방법

### ✅ 해결책 1: 백엔드 API를 HTTPS로 변경 (권장)

가장 안전하고 권장되는 방법입니다.

#### 1단계: 백엔드 서버에 SSL 인증서 설치

```bash
# finance-mhb-api.kro.kr 서버에서

# 1. Certbot 설치
sudo yum install -y certbot python3-certbot-nginx  # CentOS/RHEL
# 또는
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu/Debian

# 2. SSL 인증서 발급
sudo certbot --nginx -d finance-mhb-api.kro.kr

# 3. Nginx 재시작
sudo systemctl restart nginx
```

#### 2단계: 프론트엔드 설정 변경

프론트엔드에서 백엔드 URL을 HTTPS로 변경:

```bash
# /var/www/ddal-kkak-front 디렉토리에서

# ecosystem.config.js 수정
vi ecosystem.config.js
```

변경:
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000,
  EXPO_PUBLIC_API_URL: 'https://finance-mhb-api.kro.kr',  // http -> https
},
```

#### 3단계: 빌드 및 재시작

```bash
# 재빌드
npm run build:web

# PM2 재시작
pm2 restart ddal-kkak-front

# 또는 환경 변수와 함께 재시작
pm2 restart ddal-kkak-front --update-env
```

---

### ⚠️ 해결책 2: 임시로 프론트엔드를 HTTP로 제공 (비권장)

보안상 권장되지 않지만, 테스트용으로 임시 사용 가능합니다.

#### Nginx에서 HTTPS 비활성화

```bash
# Nginx 설정 수정
sudo vi /etc/nginx/conf.d/ddal-kkak-front.conf
```

HTTPS 서버 블록을 주석 처리하고 HTTP만 사용:

```nginx
# HTTPS 서버 주석 처리
# server {
#     listen 443 ssl http2;
#     ...
# }

# HTTP 서버만 활성화
server {
    listen 80;
    server_name www.ddalkkak.kro.kr ddalkkak.kro.kr;

    # ... (기존 설정)
}
```

```bash
# Nginx 재시작
sudo nginx -t
sudo systemctl restart nginx
```

---

### 🔧 해결책 3: 504 Timeout 해결

정적 파일 로딩 타임아웃을 해결합니다.

#### 1단계: 정적 파일이 올바른 위치에 있는지 확인

```bash
cd /var/www/ddal-kkak-front

# dist 디렉토리 확인
ls -la dist/data/undervalued-stocks/

# public 폴더의 파일이 dist로 복사되었는지 확인
```

**문제:** `dist/data/` 폴더가 없거나 파일이 없음

**해결:**
```bash
# public 폴더 확인
ls -la public/data/undervalued-stocks/

# 빌드 시 public 폴더가 dist로 복사되어야 함
npm run build:web

# 수동으로 복사 (임시 해결)
mkdir -p dist/data
cp -r public/data/* dist/data/
```

#### 2단계: Nginx 타임아웃 설정 증가

```bash
sudo vi /etc/nginx/conf.d/ddal-kkak-front.conf
```

타임아웃 설정 추가/수정:

```nginx
server {
    listen 80;
    server_name www.ddalkkak.kro.kr;

    # 타임아웃 설정
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    # 정적 파일 직접 서빙 (프록시 우회)
    location /data/ {
        alias /var/www/ddal-kkak-front/dist/data/;

        # 캐싱 설정
        expires 10m;
        add_header Cache-Control "public, must-revalidate";

        # CORS 허용 (필요한 경우)
        add_header Access-Control-Allow-Origin *;

        # 로그
        access_log /var/log/nginx/static-data-access.log;
        error_log /var/log/nginx/static-data-error.log;

        # 자동 인덱스
        autoindex off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        # ... (기존 설정)
    }
}
```

```bash
# Nginx 설정 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx
```

#### 3단계: 파일 권한 확인

```bash
# 파일 권한 확인
ls -la /var/www/ddal-kkak-front/dist/data/

# Nginx 사용자가 읽을 수 있도록 권한 설정
sudo chown -R nginx:nginx /var/www/ddal-kkak-front/dist/  # CentOS/RHEL
# 또는
sudo chown -R www-data:www-data /var/www/ddal-kkak-front/dist/  # Ubuntu/Debian

sudo chmod -R 755 /var/www/ddal-kkak-front/dist/
```

---

## 🎯 권장 해결 순서

### 단계 1: 정적 파일 빌드 확인

```bash
cd /var/www/ddal-kkak-front

# 1. public 폴더에 데이터 있는지 확인
ls -la public/data/undervalued-stocks/ | head -20

# 2. 빌드 실행
npm run build:web

# 3. dist 폴더에 복사되었는지 확인
ls -la dist/data/undervalued-stocks/ | head -20

# 4. 파일이 없다면 수동 복사
if [ ! -d "dist/data" ]; then
    mkdir -p dist/data
    cp -r public/data/* dist/data/
    echo "✅ 정적 파일 복사 완료"
fi
```

### 단계 2: Nginx 설정 업데이트

새로운 Nginx 설정 파일 적용:

```bash
# 1. 백업
sudo cp /etc/nginx/conf.d/ddal-kkak-front.conf /etc/nginx/conf.d/ddal-kkak-front.conf.bak

# 2. 설정 파일 업데이트 (아래 완전한 설정 참고)
sudo vi /etc/nginx/conf.d/ddal-kkak-front.conf

# 3. 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx
```

### 단계 3: 백엔드 API HTTPS 설정

```bash
# finance-mhb-api.kro.kr 서버에서 SSL 인증서 설치
sudo certbot --nginx -d finance-mhb-api.kro.kr

# 프론트엔드에서 URL 변경
cd /var/www/ddal-kkak-front
vi ecosystem.config.js
# EXPO_PUBLIC_API_URL: 'https://finance-mhb-api.kro.kr'로 변경

# 빌드 및 재시작
npm run build:web
pm2 restart ddal-kkak-front --update-env
```

### 단계 4: 테스트

```bash
# 1. 정적 파일 직접 접근 테스트
curl -I https://www.ddalkkak.kro.kr/data/undervalued-stocks/2025-11-25.json

# 기대 결과: HTTP/1.1 200 OK

# 2. API 호출 테스트 (HTTPS)
curl -I https://finance-mhb-api.kro.kr/api/undervalued-stocks/health

# 기대 결과: HTTP/1.1 200 OK

# 3. 브라우저에서 확인
# - 개발자 도구 > Network 탭
# - Mixed Content 경고가 사라졌는지 확인
# - 모든 요청이 HTTPS로 되는지 확인
```

---

## 📋 완전한 Nginx 설정 예시

정적 파일 서빙과 타임아웃을 포함한 완전한 설정:

```nginx
upstream ddal_kkak_backend {
    server 127.0.0.1:3000 fail_timeout=10s max_fails=3;
    keepalive 64;
}

# HTTP 서버 (HTTPS로 리다이렉트)
server {
    listen 80;
    listen [::]:80;
    server_name www.ddalkkak.kro.kr ddalkkak.kro.kr;

    # Let's Encrypt 인증서 갱신용
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # HTTPS로 리다이렉트
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 서버
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.ddalkkak.kro.kr ddalkkak.kro.kr;

    # SSL 인증서
    ssl_certificate /etc/letsencrypt/live/www.ddalkkak.kro.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.ddalkkak.kro.kr/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # 로그
    access_log /var/log/nginx/ddal-kkak-access.log;
    error_log /var/log/nginx/ddal-kkak-error.log;

    # 타임아웃 설정
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    # 클라이언트 설정
    client_max_body_size 10M;
    client_body_timeout 300s;
    client_header_timeout 300s;

    # 정적 데이터 파일 직접 서빙 (중요!)
    location /data/ {
        alias /var/www/ddal-kkak-front/dist/data/;

        # 긴 타임아웃
        sendfile on;
        sendfile_max_chunk 1m;
        tcp_nopush on;
        tcp_nodelay on;

        # 캐싱 (10분)
        expires 10m;
        add_header Cache-Control "public, must-revalidate";

        # CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, OPTIONS";

        # JSON 타입
        types {
            application/json json;
        }
        default_type application/json;

        # 로그
        access_log /var/log/nginx/static-data-access.log;
        error_log /var/log/nginx/static-data-error.log warn;
    }

    # 정적 파일 (JS, CSS, 이미지 등)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://ddal_kkak_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 나머지 모든 요청
    location / {
        proxy_pass http://ddal_kkak_backend;
        proxy_http_version 1.1;

        # 헤더
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }

    # 보안 헤더
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

---

## 🔍 디버깅 명령어

### 정적 파일 확인

```bash
# 1. 파일 존재 확인
ls -la /var/www/ddal-kkak-front/dist/data/undervalued-stocks/2025-11-25.json

# 2. 파일 읽기 권한 확인
sudo -u nginx cat /var/www/ddal-kkak-front/dist/data/undervalued-stocks/2025-11-25.json | head

# 3. 직접 curl 테스트
curl -v https://www.ddalkkak.kro.kr/data/undervalued-stocks/2025-11-25.json | head

# 4. Nginx 로그 실시간 확인
sudo tail -f /var/log/nginx/static-data-error.log
```

### Mixed Content 확인

```bash
# 백엔드 API가 HTTPS인지 확인
curl -I https://finance-mhb-api.kro.kr/api/undervalued-stocks/health

# 프론트엔드 환경 변수 확인
pm2 show ddal-kkak-front | grep EXPO_PUBLIC_API_URL
```

---

## ✅ 체크리스트

- [ ] `public/data/` 폴더에 JSON 파일들이 있는가?
- [ ] `npm run build:web` 실행 후 `dist/data/` 폴더에 파일이 복사되었는가?
- [ ] Nginx 설정에 `/data/` location 블록이 있는가?
- [ ] 파일 권한이 올바른가? (`chmod 755`)
- [ ] 백엔드 API가 HTTPS로 설정되었는가?
- [ ] `ecosystem.config.js`에서 `EXPO_PUBLIC_API_URL`이 `https://`로 시작하는가?
- [ ] PM2를 `--update-env`로 재시작했는가?
- [ ] 브라우저 콘솔에 Mixed Content 경고가 없는가?

---

**작성일**: 2025-12-04
**문제**: Mixed Content Error & 504 Gateway Timeout
