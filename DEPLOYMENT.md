# CentOS Linux 서버 배포 가이드

Ddal-Kkak Front 프로젝트를 CentOS 기반 Linux 서버에 배포하고 PM2로 관리하는 방법입니다.

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [서버 환경 설정](#서버-환경-설정)
3. [프로젝트 배포](#프로젝트-배포)
4. [PM2로 서버 시작](#pm2로-서버-시작)
5. [로그 확인 방법](#로그-확인-방법)
6. [운영 관리](#운영-관리)
7. [문제 해결](#문제-해결)

---

## 🔧 사전 요구사항

### 필수 소프트웨어

- **Node.js**: v18.x 이상 (권장: v20.x LTS)
- **npm**: v9.x 이상
- **Git**: 최신 버전
- **PM2**: v5.x 이상

### 권장 시스템 사양

- **OS**: CentOS 7/8/9 또는 RHEL 7/8/9
- **CPU**: 2 코어 이상
- **RAM**: 2GB 이상 (권장: 4GB)
- **Disk**: 10GB 이상 여유 공간

---

## 🛠 서버 환경 설정

### 1. Node.js 설치 (CentOS)

```bash
# NodeSource 저장소 추가 (Node.js 20.x LTS)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# Node.js 설치
sudo yum install -y nodejs

# 설치 확인
node --version  # v20.x.x 확인
npm --version   # v10.x.x 확인
```

### 2. PM2 전역 설치

```bash
# PM2 설치
sudo npm install -g pm2

# PM2 버전 확인
pm2 --version

# PM2 부팅 시 자동 시작 설정
pm2 startup systemd
# 출력된 명령어를 복사해서 실행하세요
```

### 3. 방화벽 설정 (포트 3000 열기)

```bash
# firewalld 사용 시
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# iptables 사용 시
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo service iptables save
```

### 4. 사용자 계정 생성 (선택사항)

```bash
# deploy 사용자 생성
sudo useradd -m -s /bin/bash deploy
sudo passwd deploy

# sudo 권한 추가
sudo usermod -aG wheel deploy
```

---

## 🚀 프로젝트 배포

### 방법 1: Git Clone (권장)

```bash
# 배포 디렉토리로 이동
cd /var/www  # 또는 원하는 경로

# 저장소 클론
sudo git clone https://github.com/moner050/ddal-kkak-front.git
cd ddal-kkak-front

# 소유권 변경 (deploy 사용자로)
sudo chown -R deploy:deploy /var/www/ddal-kkak-front

# 의존성 설치
npm install

# 프로덕션 빌드
npm run build:web
```

### 방법 2: 파일 전송

```bash
# 로컬에서 빌드 후 서버로 전송
# 로컬 환경에서:
npm run build:web
tar -czf ddal-kkak-front.tar.gz dist/ node_modules/ package.json server.js ecosystem.config.js

# 서버로 전송
scp ddal-kkak-front.tar.gz user@server:/var/www/

# 서버에서:
cd /var/www
tar -xzf ddal-kkak-front.tar.gz
```

### 환경 변수 설정

```bash
# .env 파일 생성 (프로덕션용)
cat > .env << EOF
NODE_ENV=production
PORT=3000
EXPO_PUBLIC_API_URL=http://localhost:9876
EOF

# ecosystem.config.js에서 환경 변수 수정
vi ecosystem.config.js
# env 섹션에서 EXPO_PUBLIC_API_URL을 실제 백엔드 API URL로 변경
```

---

## 🎯 PM2로 서버 시작

### 서버 시작

```bash
# PM2로 서버 시작
npm run pm2:start

# 또는 직접 PM2 명령어 사용
pm2 start ecosystem.config.js

# 상태 확인
pm2 status
pm2 list
```

### PM2 명령어 모음

```bash
# 서버 시작
npm run pm2:start        # ecosystem.config.js로 시작
pm2 start server.js      # 단일 파일로 시작

# 서버 중지
npm run pm2:stop         # 중지
pm2 stop ddal-kkak-front

# 서버 재시작
npm run pm2:restart      # 재시작
pm2 restart ddal-kkak-front

# 서버 삭제 (프로세스 목록에서 제거)
pm2 delete ddal-kkak-front

# 프로세스 목록 초기화
pm2 flush                # 로그 삭제
pm2 kill                 # PM2 데몬 종료
```

### 부팅 시 자동 시작 설정

```bash
# PM2 프로세스 목록 저장
pm2 save

# 부팅 시 자동 시작 설정
pm2 startup systemd
# 출력된 명령어 실행

# 자동 시작 확인
sudo systemctl status pm2-deploy  # deploy는 사용자명
```

---

## 📊 로그 확인 방법

### PM2 로그 명령어

```bash
# 실시간 로그 보기
npm run pm2:logs
pm2 logs ddal-kkak-front

# 최근 로그 100줄
pm2 logs ddal-kkak-front --lines 100

# 에러 로그만 보기
pm2 logs ddal-kkak-front --err

# 로그 클리어
pm2 flush
```

### tail 명령어로 로그 확인

프로젝트는 `logs/` 디렉토리에 다음 로그 파일을 생성합니다:

```bash
# Access Log (모든 HTTP 요청)
tail -f logs/access.log
tail -f logs/access.log | grep "GET"  # GET 요청만 필터링

# Error Log (4xx, 5xx 에러)
tail -f logs/error.log

# PM2 통합 로그
tail -f logs/pm2-combined.log

# PM2 에러 로그
tail -f logs/pm2-error.log

# PM2 출력 로그
tail -f logs/pm2-out.log

# 여러 로그 동시 보기
tail -f logs/access.log logs/error.log
```

### 로그 검색 및 분석

```bash
# 특정 IP 주소의 요청 검색
grep "192.168.1.100" logs/access.log

# 404 에러 검색
grep "404" logs/error.log

# 오늘 날짜 로그만 보기
grep "$(date +%Y-%m-%d)" logs/access.log

# 에러 발생 횟수 카운트
grep "Error" logs/error.log | wc -l

# 가장 많이 접근한 URL 상위 10개
awk '{print $7}' logs/access.log | sort | uniq -c | sort -rn | head -10
```

### 로그 로테이션

로그는 자동으로 로테이션됩니다:
- **주기**: 매일 자동 로테이션
- **보관 기간**: 30일
- **압축**: 오래된 로그는 gzip으로 자동 압축
- **파일 형식**: `access.log.20250101.gz`

```bash
# 압축된 로그 확인
zcat logs/access.log.20250101.gz | less

# 모든 로그 파일 크기 확인
du -sh logs/*
```

---

## 🔄 운영 관리

### 서버 모니터링

```bash
# PM2 모니터링 대시보드
npm run pm2:monit
pm2 monit

# 프로세스 상세 정보
pm2 show ddal-kkak-front

# 메모리/CPU 사용률 확인
pm2 status
```

### 서버 업데이트 배포

```bash
# 1. 코드 업데이트
cd /var/www/ddal-kkak-front
git pull origin main

# 2. 의존성 업데이트
npm install

# 3. 빌드
npm run build:web

# 4. 무중단 재시작
pm2 reload ecosystem.config.js

# 또는 일반 재시작
npm run pm2:restart
```

### Health Check

```bash
# Health Check 엔드포인트
curl http://localhost:3000/health

# JSON 포맷으로 출력
curl -s http://localhost:3000/health | python -m json.tool

# 외부에서 확인
curl http://your-server-ip:3000/health
```

### 디스크 공간 관리

```bash
# 로그 파일 크기 확인
du -sh logs/

# 오래된 로그 삭제 (30일 이상)
find logs/ -name "*.gz" -mtime +30 -delete

# PM2 로그 삭제
pm2 flush
```

---

## ❗ 문제 해결

### 서버가 시작되지 않는 경우

```bash
# 포트 사용 확인
sudo netstat -tulpn | grep 3000
sudo lsof -i :3000

# 프로세스 강제 종료
pm2 delete ddal-kkak-front
sudo pkill -f "node server.js"

# 빌드 디렉토리 확인
ls -la dist/

# 로그 확인
pm2 logs ddal-kkak-front --err
tail -f logs/pm2-error.log
```

### 메모리 부족

```bash
# 메모리 사용량 확인
free -h
pm2 status

# 인스턴스 수 줄이기
# ecosystem.config.js에서 instances: 2 → instances: 1

# 메모리 재시작 임계값 조정
# ecosystem.config.js에서 max_memory_restart: '1G' → '512M'
```

### PM2 로그가 너무 큼

```bash
# PM2 로그 삭제
pm2 flush

# 로그 로테이션 설정
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 권한 문제

```bash
# 로그 디렉토리 권한 확인
ls -la logs/

# 권한 수정
sudo chown -R deploy:deploy logs/
chmod 755 logs/
```

---

## 🔒 보안 권장사항

### 1. 방화벽 설정

```bash
# 필요한 포트만 열기
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=22/tcp  # SSH
sudo firewall-cmd --reload
```

### 2. Nginx 리버스 프록시 (권장)

```bash
# Nginx 설치
sudo yum install -y nginx

# 설정 파일 생성
sudo vi /etc/nginx/conf.d/ddal-kkak-front.conf
```

Nginx 설정 예시:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Nginx 재시작
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 3. Let's Encrypt SSL 인증서

```bash
# Certbot 설치
sudo yum install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com

# 자동 갱신 설정 (cron)
sudo crontab -e
# 추가: 0 3 * * * certbot renew --quiet
```

---

## 📚 참고 자료

- [PM2 공식 문서](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Expo Web 배포 가이드](https://docs.expo.dev/distribution/publishing-websites/)
- [CentOS 관리자 가이드](https://www.centos.org/docs/)
- [Nginx 리버스 프록시 설정](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

---

## 🆘 지원

문제가 발생하면 다음을 확인하세요:

1. **로그 확인**: `tail -f logs/*.log`
2. **PM2 상태**: `pm2 status`
3. **서버 상태**: `curl http://localhost:3000/health`
4. **GitHub Issues**: 이슈를 등록해주세요

---

**작성일**: 2025-12-04  
**버전**: 1.0.0  
**프로젝트**: Ddal-Kkak Front
