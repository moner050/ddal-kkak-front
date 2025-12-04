#!/bin/bash

###############################################################################
# Mixed Content 및 504 Timeout 자동 해결 스크립트
# 사용법: sudo bash fix-mixed-content.sh
###############################################################################

set -e

echo "======================================================================"
echo "🔧 Mixed Content & 504 Timeout 자동 해결"
echo "======================================================================"
echo ""

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 경로
PROJECT_PATH="/var/www/ddal-kkak-front"
APP_NAME="ddal-kkak-front"

###############################################################################
# 1. 정적 파일 확인 및 복사
###############################################################################
echo "📁 1. 정적 파일 확인 및 복사..."
echo ""

cd "$PROJECT_PATH"

# public/data 폴더 확인
if [ -d "public/data" ]; then
    echo -e "${GREEN}✅ public/data 폴더 존재${NC}"
    file_count=$(find public/data -type f | wc -l)
    echo "   파일 개수: $file_count"
else
    echo -e "${RED}❌ public/data 폴더가 없습니다.${NC}"
    echo "   npm run fetch-data를 먼저 실행하세요."
    exit 1
fi

# dist 폴더 확인
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  dist 폴더가 없습니다. 빌드를 실행합니다...${NC}"
    npm run build:web
fi

# dist/data로 복사
echo ""
echo "정적 파일을 dist로 복사 중..."
mkdir -p dist/data
cp -r public/data/* dist/data/
echo -e "${GREEN}✅ 정적 파일 복사 완료${NC}"

# 파일 확인
dist_file_count=$(find dist/data -type f | wc -l)
echo "   dist/data 파일 개수: $dist_file_count"

# 권한 설정
echo ""
echo "파일 권한 설정 중..."
chmod -R 755 dist/data/

# Nginx 사용자 확인 및 소유권 변경
if id "nginx" &>/dev/null; then
    sudo chown -R nginx:nginx dist/data/
    echo -e "${GREEN}✅ 파일 소유권: nginx${NC}"
elif id "www-data" &>/dev/null; then
    sudo chown -R www-data:www-data dist/data/
    echo -e "${GREEN}✅ 파일 소유권: www-data${NC}"
fi

echo ""

###############################################################################
# 2. Nginx 설정 확인
###############################################################################
echo "======================================================================"
echo "⚙️  2. Nginx 설정 확인..."
echo ""

NGINX_CONF="/etc/nginx/conf.d/ddal-kkak-front.conf"
if [ ! -f "$NGINX_CONF" ]; then
    NGINX_CONF="/etc/nginx/sites-available/ddal-kkak-front"
fi

if [ ! -f "$NGINX_CONF" ]; then
    echo -e "${RED}❌ Nginx 설정 파일을 찾을 수 없습니다.${NC}"
    echo "   예상 경로:"
    echo "   - /etc/nginx/conf.d/ddal-kkak-front.conf"
    echo "   - /etc/nginx/sites-available/ddal-kkak-front"
else
    echo -e "${GREEN}✅ Nginx 설정 파일: $NGINX_CONF${NC}"

    # /data/ location 블록이 있는지 확인
    if grep -q "location /data/" "$NGINX_CONF"; then
        echo -e "${GREEN}✅ /data/ location 블록 존재${NC}"
    else
        echo -e "${YELLOW}⚠️  /data/ location 블록이 없습니다.${NC}"
        echo ""
        echo "Nginx 설정에 다음을 추가해야 합니다:"
        echo ""
        cat << 'EOF'
    location /data/ {
        alias /var/www/ddal-kkak-front/dist/data/;
        expires 10m;
        add_header Cache-Control "public, must-revalidate";
        add_header Access-Control-Allow-Origin *;
    }
EOF
        echo ""
        echo "자동으로 추가하시겠습니까? (y/n)"
        read -r response
        if [[ "$response" == "y" ]]; then
            # 백업
            sudo cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%Y%m%d_%H%M%S)"

            # location 블록 추가 (server 블록 안에)
            sudo sed -i '/location \/ {/i \    # Static data files\n    location /data/ {\n        alias /var/www/ddal-kkak-front/dist/data/;\n        expires 10m;\n        add_header Cache-Control "public, must-revalidate";\n        add_header Access-Control-Allow-Origin *;\n    }\n' "$NGINX_CONF"

            echo -e "${GREEN}✅ Nginx 설정 업데이트 완료${NC}"
        fi
    fi
fi

echo ""

###############################################################################
# 3. 백엔드 API URL 확인
###############################################################################
echo "======================================================================"
echo "🔗 3. 백엔드 API URL 확인..."
echo ""

# ecosystem.config.js에서 API URL 확인
API_URL=$(grep "EXPO_PUBLIC_API_URL" ecosystem.config.js | head -1 | sed "s/.*'\(.*\)'.*/\1/")
echo "현재 API URL: $API_URL"

if [[ "$API_URL" == https://* ]]; then
    echo -e "${GREEN}✅ HTTPS 사용 중 (안전)${NC}"
elif [[ "$API_URL" == http://* ]]; then
    echo -e "${YELLOW}⚠️  HTTP 사용 중 (Mixed Content 경고 발생 가능)${NC}"
    echo ""
    echo "프론트엔드가 HTTPS로 제공되는 경우, 백엔드도 HTTPS여야 합니다."
    echo ""
    echo "백엔드 API를 HTTPS로 변경하시겠습니까? (y/n)"
    read -r response
    if [[ "$response" == "y" ]]; then
        # http를 https로 변경
        sed -i "s|EXPO_PUBLIC_API_URL: 'http://|EXPO_PUBLIC_API_URL: 'https://|g" ecosystem.config.js
        echo -e "${GREEN}✅ API URL을 HTTPS로 변경했습니다.${NC}"
        echo "   새 URL: $(grep "EXPO_PUBLIC_API_URL" ecosystem.config.js | head -1)"
        NEED_REBUILD=true
    fi
fi

echo ""

###############################################################################
# 4. 빌드 및 PM2 재시작
###############################################################################
echo "======================================================================"
echo "🔄 4. 애플리케이션 재시작..."
echo ""

if [ "$NEED_REBUILD" = true ]; then
    echo "설정이 변경되어 재빌드가 필요합니다..."
    npm run build:web

    # 다시 정적 파일 복사
    mkdir -p dist/data
    cp -r public/data/* dist/data/
    chmod -R 755 dist/data/
fi

# PM2 재시작
echo "PM2 재시작 중..."
pm2 restart "$APP_NAME" --update-env
sleep 2

echo -e "${GREEN}✅ PM2 재시작 완료${NC}"
pm2 status

echo ""

###############################################################################
# 5. Nginx 재시작
###############################################################################
echo "======================================================================"
echo "🔄 5. Nginx 재시작..."
echo ""

# Nginx 설정 테스트
sudo nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx 설정 문법 정상${NC}"

    # Nginx 재시작
    sudo systemctl restart nginx
    echo -e "${GREEN}✅ Nginx 재시작 완료${NC}"
else
    echo -e "${RED}❌ Nginx 설정에 오류가 있습니다.${NC}"
    echo "   수동으로 확인하세요: sudo nginx -t"
fi

echo ""

###############################################################################
# 6. 테스트
###############################################################################
echo "======================================================================"
echo "✅ 6. 테스트..."
echo ""

# 도메인 자동 감지
DOMAIN=$(grep "server_name" "$NGINX_CONF" | grep -v "#" | head -1 | awk '{print $2}' | tr -d ';')

echo "도메인: $DOMAIN"
echo ""

# 1. 정적 파일 테스트
echo "1️⃣  정적 파일 접근 테스트..."
TEST_FILE="2025-11-25.json"
if [ -f "dist/data/undervalued-stocks/$TEST_FILE" ]; then
    TEST_URL="https://$DOMAIN/data/undervalued-stocks/$TEST_FILE"
    echo "   테스트 URL: $TEST_URL"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL" --max-time 10)
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "   ${GREEN}✅ 성공 (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "   ${RED}❌ 실패 (HTTP $HTTP_CODE)${NC}"
        echo "   로그 확인: sudo tail /var/log/nginx/static-data-error.log"
    fi
else
    echo -e "   ${YELLOW}⚠️  테스트 파일 없음: dist/data/undervalued-stocks/$TEST_FILE${NC}"
fi

echo ""

# 2. Health Check
echo "2️⃣  Health Check..."
HEALTH_URL="https://$DOMAIN/health"
echo "   테스트 URL: $HEALTH_URL"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" --max-time 5)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "   ${GREEN}✅ 성공 (HTTP $HTTP_CODE)${NC}"
    curl -s "$HEALTH_URL" | python3 -m json.tool 2>/dev/null || curl -s "$HEALTH_URL"
else
    echo -e "   ${RED}❌ 실패 (HTTP $HTTP_CODE)${NC}"
fi

echo ""

# 3. 백엔드 API 테스트 (HTTPS)
if [[ "$API_URL" == https://* ]]; then
    echo "3️⃣  백엔드 API 테스트 (HTTPS)..."
    BACKEND_DOMAIN=$(echo "$API_URL" | sed 's|https://||' | sed 's|/.*||')
    BACKEND_TEST_URL="https://$BACKEND_DOMAIN/api/undervalued-stocks/health"
    echo "   테스트 URL: $BACKEND_TEST_URL"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_TEST_URL" --max-time 10 -k)
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
        echo -e "   ${GREEN}✅ 백엔드 서버 접근 가능 (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "   ${YELLOW}⚠️  백엔드 서버 응답: HTTP $HTTP_CODE${NC}"
        echo "   백엔드 서버에 SSL 인증서가 설치되어 있는지 확인하세요."
    fi
fi

echo ""

###############################################################################
# 7. 요약
###############################################################################
echo "======================================================================"
echo "📋 요약"
echo "======================================================================"
echo ""

echo -e "${BLUE}완료된 작업:${NC}"
echo "✅ 정적 파일 dist로 복사"
echo "✅ 파일 권한 설정"
echo "✅ PM2 재시작"
echo "✅ Nginx 재시작"

echo ""
echo -e "${BLUE}다음 단계:${NC}"
echo ""

if [[ "$API_URL" == http://* ]]; then
    echo -e "${YELLOW}⚠️  백엔드 API가 여전히 HTTP입니다.${NC}"
    echo ""
    echo "Mixed Content 에러를 완전히 해결하려면:"
    echo "1. 백엔드 서버($API_URL)에 SSL 인증서 설치"
    echo "   sudo certbot --nginx -d $(echo $API_URL | sed 's|http://||')"
    echo ""
    echo "2. 프론트엔드 설정 업데이트"
    echo "   vi ecosystem.config.js"
    echo "   EXPO_PUBLIC_API_URL을 https://로 변경"
    echo ""
    echo "3. 재빌드 및 재시작"
    echo "   npm run build:web"
    echo "   pm2 restart $APP_NAME --update-env"
fi

echo ""
echo -e "${BLUE}로그 확인:${NC}"
echo "- PM2: pm2 logs $APP_NAME"
echo "- Nginx 에러: sudo tail -f /var/log/nginx/error.log"
echo "- 정적 파일: sudo tail -f /var/log/nginx/static-data-error.log"

echo ""
echo -e "${GREEN}======================================================================"
echo "✅ 스크립트 완료!"
echo "======================================================================${NC}"
echo ""
echo "브라우저에서 https://$DOMAIN 접속하여 확인하세요."
echo ""
