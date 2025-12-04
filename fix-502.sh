#!/bin/bash

###############################################################################
# Nginx 502 에러 자동 진단 및 해결 스크립트
# 사용법: sudo bash fix-502.sh
###############################################################################

set -e

echo "======================================================================"
echo "🔍 Ddal-Kkak Front - Nginx 502 에러 진단 시작"
echo "======================================================================"
echo ""

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 경로 (필요시 수정)
PROJECT_PATH="/var/www/ddal-kkak-front"
APP_NAME="ddal-kkak-front"
PORT=3000

###############################################################################
# 1. PM2 상태 확인
###############################################################################
echo "📊 1. PM2 프로세스 상태 확인..."
echo ""

if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2가 설치되지 않았습니다.${NC}"
    echo "   설치: sudo npm install -g pm2"
    exit 1
fi

pm2 status

echo ""
echo -e "${YELLOW}현재 PM2 상태를 확인하세요.${NC}"
echo -e "${YELLOW}ddal-kkak-front가 'online' 상태여야 합니다.${NC}"
echo ""

# PM2 프로세스가 실행 중인지 확인
if pm2 list | grep -q "$APP_NAME.*online"; then
    echo -e "${GREEN}✅ PM2 프로세스가 실행 중입니다.${NC}"
else
    echo -e "${RED}❌ PM2 프로세스가 실행되지 않았습니다.${NC}"
    echo ""
    echo "PM2 프로세스를 시작하시겠습니까? (y/n)"
    read -r response
    if [[ "$response" == "y" ]]; then
        cd "$PROJECT_PATH"
        echo "빌드 실행 중..."
        npm run build:web
        echo "PM2 시작 중..."
        npm run pm2:start
        echo -e "${GREEN}✅ PM2 프로세스를 시작했습니다.${NC}"
    fi
fi

echo ""
echo "최근 PM2 로그 (에러 확인):"
pm2 logs "$APP_NAME" --lines 20 --nostream || true
echo ""

###############################################################################
# 2. 포트 리스닝 확인
###############################################################################
echo "======================================================================"
echo "🔌 2. 포트 $PORT 리스닝 확인..."
echo ""

if command -v netstat &> /dev/null; then
    netstat -tulpn | grep ":$PORT" || echo -e "${RED}❌ 포트 $PORT이 리스닝 중이 아닙니다.${NC}"
elif command -v ss &> /dev/null; then
    ss -tulpn | grep ":$PORT" || echo -e "${RED}❌ 포트 $PORT이 리스닝 중이 아닙니다.${NC}"
else
    lsof -i ":$PORT" || echo -e "${RED}❌ 포트 $PORT이 리스닝 중이 아닙니다.${NC}"
fi

echo ""

###############################################################################
# 3. 로컬 Health Check
###############################################################################
echo "======================================================================"
echo "🏥 3. 로컬 Health Check..."
echo ""

if curl -f http://localhost:$PORT/health &> /dev/null; then
    echo -e "${GREEN}✅ 로컬 서버가 정상 응답합니다.${NC}"
    echo ""
    curl -s http://localhost:$PORT/health | python3 -m json.tool || curl http://localhost:$PORT/health
else
    echo -e "${RED}❌ 로컬 서버가 응답하지 않습니다.${NC}"
    echo "   PM2 로그를 확인하세요: pm2 logs $APP_NAME"
fi

echo ""

###############################################################################
# 4. SELinux 확인 (CentOS/RHEL)
###############################################################################
echo "======================================================================"
echo "🔒 4. SELinux 상태 확인 (CentOS/RHEL)..."
echo ""

if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce)
    echo "SELinux 상태: $SELINUX_STATUS"

    if [ "$SELINUX_STATUS" == "Enforcing" ]; then
        echo -e "${YELLOW}⚠️  SELinux가 활성화되어 있습니다.${NC}"
        echo "   Nginx가 네트워크 연결을 할 수 없을 수 있습니다."
        echo ""
        echo "SELinux에서 Nginx 네트워크 연결을 허용하시겠습니까? (y/n)"
        read -r response
        if [[ "$response" == "y" ]]; then
            sudo setsebool -P httpd_can_network_connect 1
            echo -e "${GREEN}✅ SELinux 설정을 변경했습니다.${NC}"
        fi
    else
        echo -e "${GREEN}✅ SELinux가 비활성화되어 있거나 Permissive 모드입니다.${NC}"
    fi
else
    echo "SELinux가 설치되지 않았거나 이 시스템에는 해당 없음"
fi

echo ""

###############################################################################
# 5. Nginx 설정 확인
###############################################################################
echo "======================================================================"
echo "⚙️  5. Nginx 설정 확인..."
echo ""

if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx가 설치되지 않았습니다.${NC}"
    exit 1
fi

# Nginx 설정 테스트
echo "Nginx 설정 문법 검사:"
sudo nginx -t

echo ""
echo "Nginx 상태:"
sudo systemctl status nginx --no-pager | head -10

echo ""

###############################################################################
# 6. Nginx 에러 로그 확인
###############################################################################
echo "======================================================================"
echo "📝 6. Nginx 에러 로그 확인..."
echo ""

if [ -f /var/log/nginx/error.log ]; then
    echo "최근 Nginx 에러 로그 (502 관련):"
    sudo grep "502\|upstream" /var/log/nginx/error.log | tail -10 || echo "502 에러 로그가 없습니다."
else
    echo -e "${YELLOW}⚠️  Nginx 에러 로그 파일을 찾을 수 없습니다.${NC}"
fi

echo ""

###############################################################################
# 7. 방화벽 확인
###############################################################################
echo "======================================================================"
echo "🔥 7. 방화벽 상태 확인..."
echo ""

if command -v firewall-cmd &> /dev/null; then
    if sudo firewall-cmd --state &> /dev/null; then
        echo "방화벽 활성 상태"
        echo "포트 $PORT 허용 여부:"
        sudo firewall-cmd --list-ports | grep "$PORT" || echo -e "${YELLOW}⚠️  포트 $PORT이 방화벽에 허용되지 않았습니다.${NC}"
    fi
fi

echo ""

###############################################################################
# 8. 문제 해결 제안
###############################################################################
echo "======================================================================"
echo "💡 8. 문제 해결 제안"
echo "======================================================================"
echo ""

# PM2가 실행 중이고 로컬에서 응답하는데 Nginx에서 502가 나는 경우
if pm2 list | grep -q "$APP_NAME.*online" && curl -f http://localhost:$PORT/health &> /dev/null; then
    echo -e "${GREEN}✅ PM2 프로세스가 정상 실행 중이고 로컬에서 응답합니다.${NC}"
    echo ""
    echo "그런데도 Nginx에서 502 에러가 발생한다면:"
    echo ""
    echo "1️⃣  SELinux 문제일 가능성이 높습니다."
    echo "   해결: sudo setsebool -P httpd_can_network_connect 1"
    echo ""
    echo "2️⃣  Nginx 설정이 잘못되었을 수 있습니다."
    echo "   확인: sudo cat /etc/nginx/conf.d/ddal-kkak-front.conf"
    echo "   proxy_pass가 http://127.0.0.1:$PORT 인지 확인"
    echo ""
    echo "3️⃣  Nginx를 재시작해보세요."
    echo "   실행: sudo systemctl restart nginx"
    echo ""
else
    echo -e "${RED}❌ PM2 프로세스가 정상 응답하지 않습니다.${NC}"
    echo ""
    echo "다음 명령어로 문제를 해결하세요:"
    echo ""
    echo "1️⃣  PM2 완전 재시작"
    echo "   cd $PROJECT_PATH"
    echo "   pm2 delete $APP_NAME"
    echo "   npm run build:web"
    echo "   npm run pm2:start"
    echo ""
    echo "2️⃣  빌드 디렉토리 확인"
    echo "   ls -la $PROJECT_PATH/dist/"
    echo ""
    echo "3️⃣  PM2 로그 확인"
    echo "   pm2 logs $APP_NAME"
    echo ""
fi

###############################################################################
# 9. 자동 해결 옵션
###############################################################################
echo "======================================================================"
echo "🔧 자동 해결을 시도하시겠습니까?"
echo "======================================================================"
echo ""
echo "다음 작업을 수행합니다:"
echo "  - PM2 프로세스 재시작"
echo "  - SELinux 설정 (해당되는 경우)"
echo "  - Nginx 재시작"
echo ""
echo "계속하시겠습니까? (y/n)"
read -r response

if [[ "$response" == "y" ]]; then
    echo ""
    echo "🔧 자동 해결 시작..."
    echo ""

    # PM2 재시작
    echo "1. PM2 재시작 중..."
    cd "$PROJECT_PATH"
    pm2 restart "$APP_NAME" || npm run pm2:start
    sleep 2

    # SELinux 설정 (해당되는 경우)
    if command -v getenforce &> /dev/null && [ "$(getenforce)" == "Enforcing" ]; then
        echo "2. SELinux 설정 중..."
        sudo setsebool -P httpd_can_network_connect 1
    fi

    # Nginx 재시작
    echo "3. Nginx 재시작 중..."
    sudo systemctl restart nginx

    echo ""
    echo -e "${GREEN}✅ 자동 해결 완료!${NC}"
    echo ""
    echo "테스트 중..."
    sleep 3

    # 최종 테스트
    if curl -f http://localhost:$PORT/health &> /dev/null; then
        echo -e "${GREEN}✅ 로컬 Health Check 성공!${NC}"
        curl -s http://localhost:$PORT/health | python3 -m json.tool || curl http://localhost:$PORT/health
    else
        echo -e "${RED}❌ 여전히 문제가 있습니다. 로그를 확인하세요.${NC}"
        echo "   PM2 로그: pm2 logs $APP_NAME"
        echo "   Nginx 로그: sudo tail -f /var/log/nginx/error.log"
    fi
else
    echo "자동 해결을 건너뜁니다."
fi

echo ""
echo "======================================================================"
echo "🏁 진단 완료"
echo "======================================================================"
echo ""
echo "추가 도움이 필요하면 TROUBLESHOOTING-502.md를 참조하세요."
echo ""
