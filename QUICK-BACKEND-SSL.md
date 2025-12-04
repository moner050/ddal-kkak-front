# ⚡ Spring Boot 백엔드 HTTPS 빠른 설정 가이드

## 🎯 두 가지 방법

### ✅ 방법 1: Nginx 리버스 프록시 (권장, 5분)
- 간단하고 자동 갱신
- Spring Boot 코드 변경 불필요

### ⚠️ 방법 2: Spring Boot 직접 SSL (복잡, 20분)
- Nginx 설치 불필요
- 수동 갱신 필요

---

## 🚀 방법 1: Nginx 리버스 프록시 (권장)

### 자동 스크립트 (30초)

백엔드 서버에서:

```bash
cd /var/www/ddal-kkak-front  # 또는 스크립트가 있는 위치
sudo bash setup-backend-ssl.sh
```

대화형으로 진행됩니다:
1. 도메인 확인: `finance-mhb-api.kro.kr`
2. 포트 확인: `9876`
3. 이메일 입력: `your-email@example.com`
4. 자동 설치 및 설정!

### 수동 설정 (5분)

#### 1단계: Nginx & Certbot 설치

```bash
# CentOS/RHEL
sudo yum install -y nginx certbot python3-certbot-nginx

# Ubuntu/Debian
sudo apt install -y nginx certbot python3-certbot-nginx

# 시작
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 2단계: Nginx 설정

```bash
sudo vi /etc/nginx/conf.d/backend-api.conf
```

내용:
```nginx
upstream spring_boot_backend {
    server 127.0.0.1:9876;
}

server {
    listen 80;
    server_name finance-mhb-api.kro.kr;

    location / {
        proxy_pass http://spring_boot_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

#### 3단계: SSL 인증서 발급

```bash
sudo certbot --nginx -d finance-mhb-api.kro.kr
```

이메일 입력 후 약관 동의하면 자동으로 HTTPS 설정 완료!

#### 4단계: 테스트

```bash
curl -I https://finance-mhb-api.kro.kr/api/undervalued-stocks/health
# HTTP/1.1 200 OK
```

---

## ⚙️ 방법 2: Spring Boot 직접 SSL

### 1단계: 인증서 발급

```bash
# Spring Boot 중지 (포트 80 사용을 위해)
sudo systemctl stop your-spring-boot-service

# 인증서 발급
sudo certbot certonly --standalone -d finance-mhb-api.kro.kr

# 이메일 입력 및 약관 동의
```

### 2단계: PKCS12 변환

```bash
sudo openssl pkcs12 -export \
  -in /etc/letsencrypt/live/finance-mhb-api.kro.kr/fullchain.pem \
  -inkey /etc/letsencrypt/live/finance-mhb-api.kro.kr/privkey.pem \
  -out /etc/letsencrypt/live/finance-mhb-api.kro.kr/keystore.p12 \
  -name tomcat \
  -CAfile /etc/letsencrypt/live/finance-mhb-api.kro.kr/chain.pem

# 비밀번호 입력: changeit
```

### 3단계: application.properties 수정

```properties
server.port=443
server.ssl.enabled=true
server.ssl.key-store=/etc/letsencrypt/live/finance-mhb-api.kro.kr/keystore.p12
server.ssl.key-store-type=PKCS12
server.ssl.key-store-password=changeit
server.ssl.key-alias=tomcat
```

### 4단계: 포트 443 권한

```bash
# 옵션 1: 8443 포트 사용 + iptables
server.port=8443
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8443

# 옵션 2: authbind
sudo yum install authbind
sudo touch /etc/authbind/byport/443
sudo chmod 500 /etc/authbind/byport/443
sudo chown your-user /etc/authbind/byport/443
authbind --deep java -jar your-app.jar
```

### 5단계: 자동 갱신 스크립트

```bash
sudo vi /etc/letsencrypt/renewal-hooks/post/renew-spring-boot.sh
```

내용:
```bash
#!/bin/bash
openssl pkcs12 -export \
  -in /etc/letsencrypt/live/finance-mhb-api.kro.kr/fullchain.pem \
  -inkey /etc/letsencrypt/live/finance-mhb-api.kro.kr/privkey.pem \
  -out /etc/letsencrypt/live/finance-mhb-api.kro.kr/keystore.p12 \
  -name tomcat \
  -CAfile /etc/letsencrypt/live/finance-mhb-api.kro.kr/chain.pem \
  -password pass:changeit

systemctl restart your-spring-boot-service
```

```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/renew-spring-boot.sh
```

---

## 🔄 프론트엔드 설정 업데이트

백엔드가 HTTPS로 변경되었으니 프론트엔드도 업데이트:

```bash
cd /var/www/ddal-kkak-front

# ecosystem.config.js 수정
vi ecosystem.config.js
```

변경:
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000,
  EXPO_PUBLIC_API_URL: 'https://finance-mhb-api.kro.kr',  // ✅
},
```

```bash
# 재빌드 및 재시작
npm run build:web
pm2 restart ddal-kkak-front --update-env

# 테스트
curl -I https://www.ddalkkak.kro.kr/
# Mixed Content 경고 사라짐!
```

---

## ✅ 테스트

### 1. 백엔드 HTTPS 확인

```bash
curl -I https://finance-mhb-api.kro.kr/api/undervalued-stocks/health
# HTTP/1.1 200 OK
```

### 2. 프론트엔드 Mixed Content 확인

브라우저에서:
1. `https://www.ddalkkak.kro.kr` 접속
2. 개발자 도구 > Console
3. Mixed Content 경고가 없어야 함
4. 차트 데이터 정상 표시

### 3. 전체 흐름 확인

```bash
# 프론트엔드 → 백엔드 API 호출 흐름
Browser (HTTPS)
   ↓
Nginx (www.ddalkkak.kro.kr:443)
   ↓
PM2/Express (localhost:3000)
   ↓
Backend API (https://finance-mhb-api.kro.kr:443)
   ↓
Nginx (finance-mhb-api.kro.kr:443)
   ↓
Spring Boot (localhost:9876)
```

모두 HTTPS로 통신하므로 Mixed Content 에러 없음!

---

## 📋 체크리스트

방법 1 (Nginx 프록시):
- [ ] Nginx 설치
- [ ] Nginx 설정 파일 생성
- [ ] `sudo certbot --nginx` 실행
- [ ] `curl https://finance-mhb-api.kro.kr` 성공
- [ ] 프론트엔드 ecosystem.config.js 업데이트
- [ ] 프론트엔드 재빌드 및 재시작
- [ ] 브라우저에서 Mixed Content 경고 없음

방법 2 (Spring Boot 직접):
- [ ] Certbot standalone으로 인증서 발급
- [ ] PKCS12로 변환
- [ ] application.properties 수정
- [ ] 포트 443 권한 설정
- [ ] 자동 갱신 스크립트 작성
- [ ] Spring Boot 재시작
- [ ] 프론트엔드 설정 업데이트

---

## 🆘 트러블슈팅

### 문제: 인증서 발급 실패

```
Challenge failed for domain finance-mhb-api.kro.kr
```

**원인**: DNS가 이 서버를 가리키지 않음

**해결**:
```bash
# DNS 확인
nslookup finance-mhb-api.kro.kr
dig finance-mhb-api.kro.kr

# 포트 80 외부 접근 확인
sudo firewall-cmd --list-all
```

### 문제: Nginx 프록시가 백엔드에 연결 안 됨

```
502 Bad Gateway
```

**원인**: Spring Boot가 실행 중이 아니거나 포트가 다름

**해결**:
```bash
# Spring Boot 확인
curl http://localhost:9876/api/undervalued-stocks/health

# 포트 확인
sudo netstat -tulpn | grep 9876

# Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log
```

### 문제: Mixed Content 여전히 발생

**원인**: 프론트엔드 설정이 업데이트 안 됨

**해결**:
```bash
# 환경 변수 확인
pm2 show ddal-kkak-front | grep EXPO_PUBLIC_API_URL

# 재빌드 및 재시작
cd /var/www/ddal-kkak-front
npm run build:web
pm2 restart ddal-kkak-front --update-env
```

---

## 💡 권장 사항

### ✅ DO (권장)

- **방법 1 (Nginx 프록시)** 사용
- 자동 갱신 테스트: `sudo certbot renew --dry-run`
- 정기적인 백업
- HTTPS만 허용 (HTTP → HTTPS 리다이렉트)

### ❌ DON'T (비권장)

- 방법 2 사용 (복잡함)
- 인증서 수동 갱신 (잊어버리기 쉬움)
- HTTP와 HTTPS 동시 제공

---

## 📚 더 자세한 문서

- **상세 가이드**: `BACKEND-SSL-SETUP.md`
- **자동 스크립트**: `setup-backend-ssl.sh`
- **프론트엔드 Mixed Content 해결**: `QUICK-FIX-MIXED-CONTENT.md`

---

**권장**: 자동 스크립트 사용!
```bash
sudo bash setup-backend-ssl.sh
```

**작성일**: 2025-12-04
