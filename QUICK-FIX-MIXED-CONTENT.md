# ⚡ Mixed Content & 504 Timeout 빠른 해결 가이드

## 🔍 문제 요약

1. **Mixed Content Error**: HTTPS 사이트에서 HTTP API 호출 → 브라우저 차단
2. **504 Gateway Timeout**: 정적 JSON 파일 로딩 타임아웃

---

## 🚀 1분 빠른 해결

서버에 SSH 접속 후 자동 스크립트 실행:

```bash
cd /var/www/ddal-kkak-front
git pull origin main
sudo bash fix-mixed-content.sh
```

이 스크립트가 자동으로:
- ✅ 정적 파일 복사 (public/data → dist/data)
- ✅ 파일 권한 설정
- ✅ Nginx 설정 확인
- ✅ PM2 재시작
- ✅ Nginx 재시작
- ✅ 테스트 실행

---

## 🔧 수동 해결 (단계별)

### 1단계: 정적 파일 복사

```bash
cd /var/www/ddal-kkak-front

# 빌드 (자동으로 public → dist 복사됨)
npm run build:web

# 또는 수동 복사
mkdir -p dist/data
cp -r public/data/* dist/data/
chmod -R 755 dist/data/
```

### 2단계: Nginx 설정 업데이트

```bash
# 백업
sudo cp /etc/nginx/conf.d/ddal-kkak-front.conf /etc/nginx/conf.d/ddal-kkak-front.conf.bak

# 설정 수정
sudo vi /etc/nginx/conf.d/ddal-kkak-front.conf
```

**중요: /data/ location 블록 추가**

```nginx
server {
    # ... 기존 설정 ...

    # 정적 데이터 파일 직접 서빙 (추가!)
    location /data/ {
        alias /var/www/ddal-kkak-front/dist/data/;
        expires 10m;
        add_header Cache-Control "public, must-revalidate";
        add_header Access-Control-Allow-Origin *;
    }

    # 타임아웃 설정 (추가!)
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    location / {
        # ... 기존 프록시 설정 ...
    }
}
```

### 3단계: 백엔드 API HTTPS 변경

```bash
# ecosystem.config.js 수정
vi ecosystem.config.js
```

변경:
```javascript
EXPO_PUBLIC_API_URL: 'https://finance-mhb-api.kro.kr',  // http -> https
```

### 4단계: 재시작

```bash
# Nginx 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx

# 빌드 및 PM2 재시작
npm run build:web
pm2 restart ddal-kkak-front --update-env
```

---

## 🎯 문제별 해결책

### 문제 1: Mixed Content Error

```
Mixed Content: The page at 'https://...' was loaded over HTTPS,
but requested an insecure XMLHttpRequest endpoint 'http://...'
```

**원인:** HTTPS 사이트에서 HTTP API 호출

**해결:**

#### 옵션 A: 백엔드 API HTTPS로 변경 (권장)

```bash
# 1. 백엔드 서버에 SSL 인증서 설치
sudo certbot --nginx -d finance-mhb-api.kro.kr

# 2. 프론트엔드 설정 변경
vi ecosystem.config.js
# EXPO_PUBLIC_API_URL을 https://로 변경

# 3. 재빌드 및 재시작
npm run build:web
pm2 restart ddal-kkak-front --update-env
```

#### 옵션 B: 임시로 프론트엔드 HTTP로 (비권장)

Nginx에서 HTTPS 서버 블록 비활성화하고 HTTP만 사용

---

### 문제 2: 504 Gateway Timeout

```
GET https://www.ddalkkak.kro.kr/data/undervalued-stocks/2025-11-25.json 504
```

**원인:** 정적 파일 서빙 타임아웃

**해결:**

```bash
# 1. 파일 확인
ls -la /var/www/ddal-kkak-front/dist/data/undervalued-stocks/

# 2. 파일이 없으면 복사
mkdir -p dist/data
cp -r public/data/* dist/data/

# 3. Nginx 설정에 /data/ location 블록 추가 (위 참고)

# 4. 권한 설정
chmod -R 755 dist/data/
sudo chown -R nginx:nginx dist/data/  # CentOS/RHEL
# 또는
sudo chown -R www-data:www-data dist/data/  # Ubuntu/Debian

# 5. Nginx 재시작
sudo systemctl restart nginx
```

---

## ✅ 테스트

### 1. 정적 파일 접근 테스트

```bash
# 로컬 파일 확인
ls -la /var/www/ddal-kkak-front/dist/data/undervalued-stocks/2025-11-25.json

# HTTP 접근 테스트
curl -I https://www.ddalkkak.kro.kr/data/undervalued-stocks/2025-11-25.json

# 기대 결과: HTTP/1.1 200 OK
```

### 2. Mixed Content 확인

브라우저 개발자 도구 > Console 탭:
- ❌ "Mixed Content" 경고가 있으면 아직 미해결
- ✅ 경고가 없으면 해결됨

### 3. 네트워크 확인

브라우저 개발자 도구 > Network 탭:
- 모든 요청이 `https://`로 시작하는지 확인
- `/data/` 요청이 200 OK인지 확인

---

## 📋 체크리스트

순서대로 확인:

- [ ] `ls -la public/data/` → 파일들이 존재하는가?
- [ ] `npm run build:web` 실행했는가?
- [ ] `ls -la dist/data/` → 파일들이 복사되었는가?
- [ ] Nginx 설정에 `/data/ { alias ... }` 블록이 있는가?
- [ ] 파일 권한 `chmod 755`로 설정했는가?
- [ ] `ecosystem.config.js`에서 API URL이 `https://`인가?
- [ ] `pm2 restart --update-env`로 재시작했는가?
- [ ] `sudo systemctl restart nginx`로 Nginx 재시작했는가?
- [ ] 브라우저 콘솔에 Mixed Content 경고 없는가?
- [ ] 차트에 데이터가 표시되는가?

---

## 🆘 여전히 안 되면?

### 로그 확인

```bash
# PM2 로그
pm2 logs ddal-kkak-front --lines 50

# Nginx 에러 로그
sudo tail -50 /var/log/nginx/error.log

# 정적 파일 로그
sudo tail -50 /var/log/nginx/static-data-error.log
```

### 직접 테스트

```bash
# 1. 파일이 실제로 있는지
ls -la /var/www/ddal-kkak-front/dist/data/undervalued-stocks/2025-11-25.json

# 2. Nginx 사용자가 읽을 수 있는지
sudo -u nginx cat /var/www/ddal-kkak-front/dist/data/undervalued-stocks/2025-11-25.json | head

# 3. HTTP로 직접 접근
curl -v https://www.ddalkkak.kro.kr/data/undervalued-stocks/2025-11-25.json 2>&1 | grep "HTTP"

# 4. 백엔드 API HTTPS 확인
curl -I https://finance-mhb-api.kro.kr/api/undervalued-stocks/health
```

---

## 📚 더 자세한 문서

- **상세 가이드**: `TROUBLESHOOTING-MIXED-CONTENT.md`
- **업데이트된 Nginx 설정**: `nginx-updated.conf.example`
- **자동 스크립트**: `fix-mixed-content.sh`

---

## 💡 핵심 포인트

1. **빌드 시 자동 복사**: `npm run build:web` 하면 `public/data`가 자동으로 `dist/data`로 복사됨
2. **Nginx 직접 서빙**: `/data/` 요청은 PM2 거치지 않고 Nginx가 직접 서빙
3. **HTTPS 통일**: 프론트엔드와 백엔드 모두 HTTPS 사용해야 Mixed Content 에러 없음
4. **타임아웃 증가**: 큰 JSON 파일을 위해 Nginx 타임아웃 300초로 설정

---

**작성일**: 2025-12-04
**문제**: Mixed Content Error & 504 Gateway Timeout
