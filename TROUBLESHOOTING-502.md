# Nginx 502 Bad Gateway 해결 가이드

PM2 도입 후 Nginx에서 502 에러가 발생하는 경우 이 가이드를 따라주세요.

## 🔍 1단계: 문제 진단

### 1.1 PM2 프로세스 상태 확인

```bash
# PM2 프로세스 목록 확인
pm2 status

# ddal-kkak-front 상세 정보 확인
pm2 show ddal-kkak-front

# PM2 로그 확인 (에러 확인)
pm2 logs ddal-kkak-front --lines 100
```

**예상 결과:**
- 상태가 `online`이어야 합니다
- `errored` 또는 `stopped` 상태라면 서버가 제대로 시작되지 않은 것입니다

### 1.2 포트 3000 리스닝 확인

```bash
# 포트 3000이 열려있는지 확인
sudo netstat -tulpn | grep :3000
# 또는
sudo ss -tulpn | grep :3000
# 또는
sudo lsof -i :3000
```

**예상 결과:**
```
tcp        0      0 0.0.0.0:3000            0.0.0.0:*               LISTEN      12345/node
```

포트가 열려있지 않다면 서버가 시작되지 않은 것입니다.

### 1.3 로컬 Health Check

```bash
# localhost에서 직접 접근 테스트
curl http://localhost:3000/health

# 성공 시 출력:
# {"status":"OK","timestamp":"...","uptime":123,...}
```

### 1.4 Nginx 에러 로그 확인

```bash
# Nginx 에러 로그 확인
sudo tail -f /var/log/nginx/error.log

# 502 에러 관련 로그 검색
sudo grep "502" /var/log/nginx/error.log | tail -20
```

---

## 🔧 2단계: 일반적인 문제 해결

### 문제 A: PM2 프로세스가 시작되지 않음

#### 증상
```bash
pm2 status
# 상태: stopped, errored, 또는 목록에 없음
```

#### 해결 방법

```bash
# 1. 기존 프로세스 삭제
pm2 delete ddal-kkak-front

# 2. 빌드 디렉토리 확인
ls -la dist/
# dist/ 디렉토리가 없다면:
npm run build:web

# 3. PM2 재시작
cd /var/www/ddal-kkak-front  # 프로젝트 경로로 이동
npm run pm2:start

# 4. 상태 확인
pm2 status
pm2 logs ddal-kkak-front --lines 50
```

### 문제 B: 포트 충돌 (다른 프로세스가 3000 사용 중)

#### 증상
```
Error: listen EADDRINUSE: address already in use :::3000
```

#### 해결 방법

```bash
# 1. 포트 사용 중인 프로세스 찾기
sudo lsof -i :3000
# 또는
sudo netstat -tulpn | grep :3000

# 2. 해당 프로세스 종료
sudo kill -9 <PID>

# 3. PM2 재시작
pm2 restart ddal-kkak-front
```

### 문제 C: SELinux 차단 (CentOS/RHEL)

#### 증상
- PM2는 정상 실행
- `curl localhost:3000` 성공
- Nginx에서만 502 에러

#### 해결 방법

```bash
# 1. SELinux 상태 확인
sudo getenforce
# Enforcing이면 SELinux가 활성화된 상태

# 2. SELinux 로그 확인
sudo tail -f /var/log/audit/audit.log | grep denied

# 3. Nginx가 네트워크 연결할 수 있도록 허용
sudo setsebool -P httpd_can_network_connect 1

# 4. Nginx 재시작
sudo systemctl restart nginx
```

### 문제 D: Nginx 설정 오류

#### Nginx 설정 확인

```bash
# Nginx 설정 파일 찾기
sudo nginx -t
# 설정 파일 경로: /etc/nginx/nginx.conf

# ddal-kkak-front 설정 확인
sudo cat /etc/nginx/conf.d/ddal-kkak-front.conf
# 또는
sudo cat /etc/nginx/sites-available/ddal-kkak-front
```

#### 올바른 Nginx 설정 예시

```nginx
upstream ddal_kkak_backend {
    server 127.0.0.1:3000 fail_timeout=0;
}

server {
    listen 80;
    server_name finance-mhb-front.kro.kr;  # 도메인 변경

    # 접근 로그
    access_log /var/log/nginx/ddal-kkak-access.log;
    error_log /var/log/nginx/ddal-kkak-error.log;

    location / {
        proxy_pass http://ddal_kkak_backend;
        proxy_http_version 1.1;

        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 헤더 설정
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://ddal_kkak_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Nginx 설정 적용

```bash
# 1. 설정 파일 생성/수정
sudo vi /etc/nginx/conf.d/ddal-kkak-front.conf

# 2. 설정 문법 검사
sudo nginx -t

# 3. Nginx 재시작
sudo systemctl restart nginx

# 4. Nginx 상태 확인
sudo systemctl status nginx
```

---

## 🚀 3단계: 전체 재시작 (최종 해결책)

모든 것을 처음부터 다시 시작합니다:

```bash
# 1. PM2 프로세스 완전 정리
pm2 delete all
pm2 kill

# 2. 프로젝트 디렉토리로 이동
cd /var/www/ddal-kkak-front

# 3. 최신 코드 pull (선택사항)
git pull origin main

# 4. 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 5. 프로덕션 빌드
npm run build:web

# 6. dist 디렉토리 확인
ls -la dist/

# 7. PM2로 서버 시작
npm run pm2:start

# 8. PM2 상태 확인
pm2 status
pm2 logs ddal-kkak-front --lines 20

# 9. 로컬 테스트
curl http://localhost:3000/health

# 10. Nginx 재시작
sudo systemctl restart nginx

# 11. 외부 접근 테스트
curl http://your-server-ip/health
```

---

## 🔍 4단계: 상세 디버깅

### 실시간 로그 모니터링

```bash
# 터미널 1: PM2 로그
pm2 logs ddal-kkak-front

# 터미널 2: Nginx 에러 로그
sudo tail -f /var/log/nginx/error.log

# 터미널 3: 서버 접근 테스트
watch -n 1 'curl -I http://localhost:3000/health'
```

### PM2 환경 변수 확인

```bash
# 현재 환경 변수 확인
pm2 show ddal-kkak-front

# 환경 변수가 제대로 설정되었는지 확인
# EXPO_PUBLIC_API_URL이 http://finance-mhb-api.kro.kr인지 확인
```

### 서버 리소스 확인

```bash
# 메모리 사용량
free -h

# CPU 사용량
top

# 디스크 공간
df -h

# PM2 모니터링
pm2 monit
```

---

## 📋 체크리스트

문제 해결 시 다음 항목들을 순서대로 확인하세요:

- [ ] PM2 프로세스가 `online` 상태인가?
- [ ] `pm2 logs`에 에러가 없는가?
- [ ] 포트 3000이 리스닝 중인가?
- [ ] `curl localhost:3000/health`가 정상 응답하는가?
- [ ] Nginx 설정에서 `proxy_pass http://127.0.0.1:3000`이 올바른가?
- [ ] SELinux가 활성화되어 있다면 `httpd_can_network_connect`가 켜져 있는가?
- [ ] Nginx 에러 로그에 특정 에러 메시지가 있는가?
- [ ] 방화벽이 포트 3000을 차단하지 않는가?

---

## 💡 가장 흔한 원인과 해결책

### 1. PM2 프로세스가 자동으로 죽음
**원인:** 메모리 부족 또는 빌드 파일 없음
**해결:** `npm run build:web` 후 PM2 재시작

### 2. SELinux 차단 (CentOS/RHEL)
**원인:** SELinux가 Nginx의 네트워크 연결 차단
**해결:** `sudo setsebool -P httpd_can_network_connect 1`

### 3. 포트 바인딩 실패
**원인:** 다른 프로세스가 포트 3000 사용 중
**해결:** `sudo lsof -i :3000`으로 찾아서 종료

### 4. Nginx 타임아웃
**원인:** PM2 앱 시작이 느림
**해결:** Nginx 설정에 타임아웃 증가
```nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

---

## 🆘 여전히 해결되지 않는 경우

다음 정보를 수집해서 공유해주세요:

```bash
# 1. PM2 상태
pm2 status

# 2. PM2 로그 (최근 100줄)
pm2 logs ddal-kkak-front --lines 100 --nostream > pm2-logs.txt

# 3. Nginx 에러 로그
sudo tail -100 /var/log/nginx/error.log > nginx-error.txt

# 4. 포트 리스닝 상태
sudo netstat -tulpn | grep :3000 > port-status.txt

# 5. 시스템 리소스
free -h > system-resources.txt
df -h >> system-resources.txt

# 6. SELinux 상태 (CentOS/RHEL만)
getenforce > selinux-status.txt
```

---

**작성일**: 2025-12-04
**프로젝트**: Ddal-Kkak Front
**문제**: Nginx 502 Bad Gateway after PM2 deployment
