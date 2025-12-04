# 🚨 Nginx 502 에러 빠른 해결 가이드

502 Bad Gateway 에러가 발생했을 때 **가장 먼저 시도해야 할 명령어들**입니다.

## ⚡ 1분 빠른 해결 (대부분의 경우 해결됨)

서버에 SSH 접속 후 다음 명령어들을 **순서대로** 실행하세요:

```bash
# 1. 프로젝트 디렉토리로 이동
cd /var/www/ddal-kkak-front

# 2. PM2 재시작
pm2 restart ddal-kkak-front

# 3. 2초 대기
sleep 2

# 4. 로컬 테스트
curl http://localhost:3000/health

# 5. SELinux 설정 (CentOS/RHEL만)
sudo setsebool -P httpd_can_network_connect 1

# 6. Nginx 재시작
sudo systemctl restart nginx

# 7. 최종 테스트
curl http://localhost/health
```

**결과:**
- ✅ JSON 응답이 나오면 해결!
- ❌ 여전히 에러가 나면 아래 단계별 진단으로 이동

---

## 🔍 단계별 진단 (위의 빠른 해결이 안 될 때)

### 1️⃣ PM2 상태 확인

```bash
pm2 status
```

**예상 결과:**
```
┌─────┬────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name               │ mode    │ status  │ cpu      │
├─────┼────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ ddal-kkak-front   │ cluster │ online  │ 0%       │
└─────┴────────────────────┴─────────┴─────────┴──────────┘
```

**❌ 문제:** `stopped`, `errored`, 또는 목록에 없음
**✅ 해결:**
```bash
cd /var/www/ddal-kkak-front
pm2 delete ddal-kkak-front
npm run build:web
npm run pm2:start
```

---

### 2️⃣ 포트 리스닝 확인

```bash
sudo lsof -i :3000
```

**예상 결과:**
```
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    12345 user   21u  IPv6 123456      0t0  TCP *:3000 (LISTEN)
```

**❌ 문제:** 아무 것도 안 나옴 (포트가 열려있지 않음)
**✅ 해결:**
```bash
pm2 logs ddal-kkak-front --lines 50
# 에러를 확인하고 수정 후:
pm2 restart ddal-kkak-front
```

---

### 3️⃣ 로컬 Health Check

```bash
curl http://localhost:3000/health
```

**예상 결과:**
```json
{"status":"OK","timestamp":"2025-12-04T...","uptime":123,...}
```

**❌ 문제:** `curl: (7) Failed to connect`
**✅ 해결:** PM2 프로세스가 죽었거나 시작 안 됨 → 1️⃣ 단계로 이동

---

### 4️⃣ SELinux 확인 (CentOS/RHEL만)

```bash
getenforce
```

**문제:** `Enforcing` 출력됨
**✅ 해결:**
```bash
sudo setsebool -P httpd_can_network_connect 1
sudo systemctl restart nginx
```

---

### 5️⃣ Nginx 에러 로그 확인

```bash
sudo tail -50 /var/log/nginx/error.log | grep -i "502\|upstream"
```

**자주 나오는 에러와 해결책:**

#### 에러 1: `connect() failed (111: Connection refused)`
```
2025/12/04 10:00:00 [error] connect() failed (111: Connection refused) while connecting to upstream
```
**원인:** PM2 앱이 실행 안 됨 또는 포트 3000 리스닝 안 함
**해결:** 1️⃣ 단계로 이동

#### 에러 2: `connect() failed (13: Permission denied)`
```
2025/12/04 10:00:00 [error] connect() failed (13: Permission denied) while connecting to upstream
```
**원인:** SELinux가 Nginx의 네트워크 연결 차단
**해결:**
```bash
sudo setsebool -P httpd_can_network_connect 1
sudo systemctl restart nginx
```

#### 에러 3: `no live upstreams`
```
2025/12/04 10:00:00 [error] no live upstreams while connecting to upstream
```
**원인:** upstream 서버(PM2 앱)가 응답 안 함
**해결:** PM2 재시작

---

## 🔧 자동 진단 스크립트 실행

모든 문제를 자동으로 진단하고 해결하는 스크립트:

```bash
cd /var/www/ddal-kkak-front
sudo bash fix-502.sh
```

이 스크립트는 다음을 자동으로 수행합니다:
- ✅ PM2 상태 확인
- ✅ 포트 리스닝 확인
- ✅ Health check
- ✅ SELinux 확인 및 설정
- ✅ Nginx 로그 분석
- ✅ 자동 해결 시도

---

## 🆘 여전히 안 되면?

### 완전 초기화 (최후의 수단)

```bash
# 1. PM2 완전 정리
pm2 delete all
pm2 kill

# 2. 프로젝트 디렉토리로 이동
cd /var/www/ddal-kkak-front

# 3. 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 4. 빌드
npm run build:web

# 5. PM2 시작
npm run pm2:start

# 6. 상태 확인
pm2 status
pm2 logs ddal-kkak-front --lines 20

# 7. 로컬 테스트
curl http://localhost:3000/health

# 8. SELinux 설정 (CentOS/RHEL만)
sudo setsebool -P httpd_can_network_connect 1

# 9. Nginx 재시작
sudo systemctl restart nginx

# 10. 최종 테스트
curl http://your-domain/health
```

---

## 📋 체크리스트

문제 해결 시 순서대로 체크하세요:

- [ ] `pm2 status` → ddal-kkak-front가 `online` 상태인가?
- [ ] `pm2 logs ddal-kkak-front` → 에러 로그가 없는가?
- [ ] `sudo lsof -i :3000` → 포트 3000이 리스닝 중인가?
- [ ] `curl localhost:3000/health` → 정상 응답하는가?
- [ ] `getenforce` → `Enforcing`이면 SELinux 설정했는가?
- [ ] `sudo nginx -t` → Nginx 설정이 올바른가?
- [ ] Nginx 설정에서 `proxy_pass http://127.0.0.1:3000`이 맞는가?

---

## 💡 자주 묻는 질문

### Q1: PM2는 실행 중인데 Nginx에서만 502가 나요
**A:** 99% SELinux 문제입니다.
```bash
sudo setsebool -P httpd_can_network_connect 1
sudo systemctl restart nginx
```

### Q2: PM2 상태가 계속 `errored`로 바뀌어요
**A:** 빌드 파일이 없거나 에러가 있습니다.
```bash
npm run build:web
pm2 logs ddal-kkak-front
```

### Q3: 다른 포트를 사용하고 싶어요
**A:**
1. `ecosystem.config.js`에서 `PORT` 변경
2. `server.js`에서 `PORT` 확인
3. Nginx 설정에서 `proxy_pass` 포트 변경
4. PM2 재시작 + Nginx 재시작

---

## 📚 더 자세한 문서

- **상세 진단 가이드**: `TROUBLESHOOTING-502.md`
- **Nginx 설정 예시**: `nginx.conf.example`
- **배포 가이드**: `DEPLOYMENT.md`

---

**빠른 문의:**
1. PM2 로그: `pm2 logs ddal-kkak-front`
2. Nginx 로그: `sudo tail -f /var/log/nginx/error.log`
3. 시스템 로그: `sudo journalctl -xe`
