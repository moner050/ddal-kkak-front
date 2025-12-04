#!/bin/bash

###############################################################################
# Spring Boot 백엔드 HTTPS 자동 설정 스크립트 (Nginx 프록시 방식)
# 사용법: sudo bash setup-backend-ssl.sh
###############################################################################

set -e

echo "======================================================================"
echo "🔐 Spring Boot Backend HTTPS 설정"
echo "======================================================================"
echo ""

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
DOMAIN="finance-mhb-api.kro.kr"
BACKEND_PORT="9876"
EMAIL=""  # Let's Encrypt 이메일 (나중에 입력)

###############################################################################
# 0. 사용자 입력
###############################################################################
echo -e "${BLUE}설정 확인:${NC}"
echo "도메인: $DOMAIN"
echo "Spring Boot 포트: $BACKEND_PORT"
echo ""

read -p "도메인이 맞습니까? (y/n): " response
if [[ "$response" != "y" ]]; then
    read -p "도메인 입력: " DOMAIN
fi

read -p "Spring Boot 포트가 $BACKEND_PORT 맞습니까? (y/n): " response
if [[ "$response" != "y" ]]; then
    read -p "포트 입력: " BACKEND_PORT
fi

read -p "Let's Encrypt 이메일 주소: " EMAIL

echo ""
echo "최종 설정:"
echo "  - 도메인: $DOMAIN"
echo "  - 백엔드 포트: $BACKEND_PORT"
echo "  - 이메일: $EMAIL"
echo ""

read -p "계속하시겠습니까? (y/n): " response
if [[ "$response" != "y" ]]; then
    echo "취소되었습니다."
    exit 0
fi

echo ""

###############################################################################
# 1. Nginx 설치
###############################################################################
echo "======================================================================"
echo "📦 1. Nginx 설치 확인..."
echo ""

if ! command -v nginx &> /dev/null; then
    echo "Nginx가 설치되어 있지 않습니다. 설치 중..."

    # OS 감지
    if [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        sudo yum install -y nginx
    elif [ -f /etc/debian_version ]; then
        # Ubuntu/Debian
        sudo apt update
        sudo apt install -y nginx
    else
        echo -e "${RED}❌ 지원하지 않는 OS입니다.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Nginx 설치 완료${NC}"
else
    echo -e "${GREEN}✅ Nginx가 이미 설치되어 있습니다.${NC}"
    nginx -v
fi

echo ""

###############################################################################
# 2. Certbot 설치
###############################################################################
echo "======================================================================"
echo "📦 2. Certbot 설치 확인..."
echo ""

if ! command -v certbot &> /dev/null; then
    echo "Certbot이 설치되어 있지 않습니다. 설치 중..."

    # OS 감지
    if [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        sudo yum install -y certbot python3-certbot-nginx
    elif [ -f /etc/debian_version ]; then
        # Ubuntu/Debian
        sudo apt install -y certbot python3-certbot-nginx
    fi

    echo -e "${GREEN}✅ Certbot 설치 완료${NC}"
else
    echo -e "${GREEN}✅ Certbot이 이미 설치되어 있습니다.${NC}"
    certbot --version
fi

echo ""

###############################################################################
# 3. Nginx 설정 파일 생성
###############################################################################
echo "======================================================================"
echo "⚙️  3. Nginx 설정 파일 생성..."
echo ""

NGINX_CONF="/etc/nginx/conf.d/backend-api.conf"

# 백업
if [ -f "$NGINX_CONF" ]; then
    sudo cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%Y%m%d_%H%M%S)"
    echo "기존 설정 백업: ${NGINX_CONF}.bak"
fi

# 설정 파일 생성
sudo tee "$NGINX_CONF" > /dev/null <<EOF
# Spring Boot Backend API - Nginx Configuration
# Generated: $(date)

# Upstream 정의
upstream spring_boot_backend {
    server 127.0.0.1:${BACKEND_PORT} fail_timeout=10s max_fails=3;
    keepalive 64;
}

# HTTP 서버 (HTTPS로 리다이렉트)
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Let's Encrypt 인증서 갱신용
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # 임시로 모든 요청 허용 (SSL 인증서 발급 전)
    location / {
        proxy_pass http://spring_boot_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo -e "${GREEN}✅ Nginx 설정 파일 생성: $NGINX_CONF${NC}"
echo ""

###############################################################################
# 4. Nginx 테스트 및 재시작
###############################################################################
echo "======================================================================"
echo "🔄 4. Nginx 테스트 및 재시작..."
echo ""

sudo nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx 설정 문법 정상${NC}"
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    echo -e "${GREEN}✅ Nginx 재시작 완료${NC}"
else
    echo -e "${RED}❌ Nginx 설정 오류${NC}"
    exit 1
fi

echo ""

###############################################################################
# 5. 방화벽 설정
###############################################################################
echo "======================================================================"
echo "🔥 5. 방화벽 설정..."
echo ""

if command -v firewall-cmd &> /dev/null; then
    echo "firewalld 방화벽 설정 중..."
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
    echo -e "${GREEN}✅ firewalld 설정 완료${NC}"
elif command -v ufw &> /dev/null; then
    echo "ufw 방화벽 설정 중..."
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo -e "${GREEN}✅ ufw 설정 완료${NC}"
else
    echo -e "${YELLOW}⚠️  방화벽이 감지되지 않았습니다.${NC}"
    echo "   필요시 수동으로 포트 80, 443을 열어주세요."
fi

echo ""

###############################################################################
# 6. Spring Boot 연결 테스트
###############################################################################
echo "======================================================================"
echo "🔌 6. Spring Boot 연결 테스트..."
echo ""

echo "Spring Boot가 포트 $BACKEND_PORT에서 실행 중인지 확인 중..."
if curl -f http://localhost:$BACKEND_PORT/actuator/health &> /dev/null || \
   curl -f http://localhost:$BACKEND_PORT/api/undervalued-stocks/health &> /dev/null; then
    echo -e "${GREEN}✅ Spring Boot가 정상 실행 중입니다.${NC}"
else
    echo -e "${YELLOW}⚠️  Spring Boot가 응답하지 않습니다.${NC}"
    echo "   Spring Boot 애플리케이션이 포트 $BACKEND_PORT에서 실행 중인지 확인하세요."
    echo ""
    read -p "계속하시겠습니까? (y/n): " response
    if [[ "$response" != "y" ]]; then
        exit 1
    fi
fi

echo ""

###############################################################################
# 7. SSL 인증서 발급
###############################################################################
echo "======================================================================"
echo "🔐 7. SSL 인증서 발급..."
echo ""

echo "Let's Encrypt SSL 인증서를 발급합니다."
echo ""
echo -e "${YELLOW}주의:${NC}"
echo "  - 도메인 $DOMAIN이 이 서버의 IP를 가리켜야 합니다."
echo "  - 포트 80이 외부에서 접근 가능해야 합니다."
echo ""

read -p "SSL 인증서를 발급하시겠습니까? (y/n): " response
if [[ "$response" == "y" ]]; then
    # Certbot 실행
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ SSL 인증서 발급 성공!${NC}"
    else
        echo -e "${RED}❌ SSL 인증서 발급 실패${NC}"
        echo "   다음을 확인하세요:"
        echo "   1. 도메인이 이 서버를 가리키는지 (DNS 설정)"
        echo "   2. 포트 80이 외부에서 접근 가능한지"
        echo "   3. 방화벽 설정이 올바른지"
        exit 1
    fi
else
    echo "SSL 인증서 발급을 건너뜁니다."
    echo "나중에 수동으로 발급하세요: sudo certbot --nginx -d $DOMAIN"
fi

echo ""

###############################################################################
# 8. Nginx 설정 업데이트 (HTTPS 추가)
###############################################################################
echo "======================================================================"
echo "⚙️  8. Nginx 최종 설정 업데이트..."
echo ""

# HTTPS 설정 추가
sudo tee "$NGINX_CONF" > /dev/null <<EOF
# Spring Boot Backend API - Nginx Configuration
# Generated: $(date)

# Upstream 정의
upstream spring_boot_backend {
    server 127.0.0.1:${BACKEND_PORT} fail_timeout=10s max_fails=3;
    keepalive 64;
}

# HTTP 서버 (HTTPS로 리다이렉트)
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Let's Encrypt 인증서 갱신용
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # HTTPS로 리다이렉트
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS 서버
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    # SSL 인증서
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 로그
    access_log /var/log/nginx/backend-api-access.log combined;
    error_log /var/log/nginx/backend-api-error.log warn;

    # 타임아웃 설정
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # 클라이언트 설정
    client_max_body_size 10M;

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types application/json application/javascript text/plain text/css;

    # 모든 요청을 Spring Boot로 프록시
    location / {
        proxy_pass http://spring_boot_backend;
        proxy_http_version 1.1;

        # 헤더 설정
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Port \$server_port;

        # Keep-alive
        proxy_set_header Connection "";

        # CORS (필요한 경우)
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;

        # OPTIONS 요청 처리
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }

    # 보안 헤더
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

# Nginx 재시작
sudo nginx -t && sudo systemctl restart nginx

echo -e "${GREEN}✅ Nginx 최종 설정 완료${NC}"
echo ""

###############################################################################
# 9. 테스트
###############################################################################
echo "======================================================================"
echo "✅ 9. 최종 테스트..."
echo ""

echo "HTTP → HTTPS 리다이렉트 테스트..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L http://$DOMAIN/api/undervalued-stocks/health --max-time 10 || echo "000")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
    echo -e "${GREEN}✅ HTTP 접근 성공 (코드: $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP 접근: $HTTP_CODE${NC}"
fi

echo ""
echo "HTTPS 직접 접근 테스트..."
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/undervalued-stocks/health --max-time 10 -k || echo "000")
if [ "$HTTPS_CODE" == "200" ] || [ "$HTTPS_CODE" == "404" ]; then
    echo -e "${GREEN}✅ HTTPS 접근 성공 (코드: $HTTPS_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS 접근: $HTTPS_CODE${NC}"
fi

echo ""

###############################################################################
# 10. 요약
###############################################################################
echo "======================================================================"
echo "📋 설정 완료 요약"
echo "======================================================================"
echo ""

echo -e "${GREEN}✅ Nginx 리버스 프록시 설정 완료!${NC}"
echo ""
echo "설정 정보:"
echo "  - 도메인: https://$DOMAIN"
echo "  - 백엔드: http://localhost:$BACKEND_PORT"
echo "  - Nginx 설정: $NGINX_CONF"
echo "  - SSL 인증서: /etc/letsencrypt/live/$DOMAIN/"
echo ""

echo "다음 단계:"
echo ""
echo "1️⃣  프론트엔드 설정 업데이트"
echo "   cd /var/www/ddal-kkak-front"
echo "   vi ecosystem.config.js"
echo "   # EXPO_PUBLIC_API_URL: 'https://$DOMAIN'로 변경"
echo ""

echo "2️⃣  프론트엔드 재빌드 및 재시작"
echo "   npm run build:web"
echo "   pm2 restart ddal-kkak-front --update-env"
echo ""

echo "3️⃣  테스트"
echo "   curl -I https://$DOMAIN/api/undervalued-stocks/health"
echo "   # 브라우저에서 프론트엔드 접속 후 Mixed Content 경고 확인"
echo ""

echo "인증서 자동 갱신:"
echo "  - 자동: cron이 매일 확인 (certbot renew)"
echo "  - 수동 테스트: sudo certbot renew --dry-run"
echo ""

echo "로그 확인:"
echo "  - Nginx 접근: sudo tail -f /var/log/nginx/backend-api-access.log"
echo "  - Nginx 에러: sudo tail -f /var/log/nginx/backend-api-error.log"
echo ""

echo -e "${GREEN}======================================================================"
echo "🎉 설정 완료!"
echo "======================================================================${NC}"
echo ""
