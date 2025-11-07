#!/bin/bash

# ============================================================
# 주식 데이터 수집 실행 스크립트
# 매일 오전에 자동 실행되도록 cron에 등록
# ============================================================

set -e  # 에러 발생시 중단

# 환경 변수 설정
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PYTHON_DIR="$PROJECT_ROOT/python"
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backup"

# 로그 디렉토리 생성
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

# 로그 파일
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/data_collection_${TIMESTAMP}.log"

echo "============================================================" | tee -a "$LOG_FILE"
echo "주식 데이터 수집 시작: $(date)" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"

# 데이터베이스 연결 정보 (환경변수 또는 .env 파일에서 읽기)
export DB_HOST="${DB_HOST:-localhost}"
export DB_PORT="${DB_PORT:-5432}"
export DB_NAME="${DB_NAME:-ddal_kkak}"
export DB_USER="${DB_USER:-postgres}"
export DB_PASSWORD="${DB_PASSWORD:-postgres}"

# Python 가상환경 활성화 (venv 사용하는 경우)
if [ -d "$PYTHON_DIR/venv" ]; then
    echo "Python 가상환경 활성화..." | tee -a "$LOG_FILE"
    source "$PYTHON_DIR/venv/bin/activate"
fi

# 1단계: 데이터 수집 (build_details_cache_fully_optimized.py)
echo "" | tee -a "$LOG_FILE"
echo "1단계: 기본 데이터 수집 중..." | tee -a "$LOG_FILE"
cd "$PYTHON_DIR"

python data_collector_with_db.py 2>&1 | tee -a "$LOG_FILE"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌ 데이터 수집 실패!" | tee -a "$LOG_FILE"
    exit 1
fi

echo "✅ 데이터 수집 완료" | tee -a "$LOG_FILE"

# 2단계: 스크리닝 및 점수 계산 (improved_stock_screener.py)
echo "" | tee -a "$LOG_FILE"
echo "2단계: 스크리닝 및 점수 계산 중..." | tee -a "$LOG_FILE"

python stock_screener_with_db.py --profile all --export-excel 2>&1 | tee -a "$LOG_FILE"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌ 스크리닝 실패!" | tee -a "$LOG_FILE"
    exit 1
fi

echo "✅ 스크리닝 완료" | tee -a "$LOG_FILE"

# 3단계: 백업 (선택사항)
echo "" | tee -a "$LOG_FILE"
echo "3단계: 백업 중..." | tee -a "$LOG_FILE"

# CSV 백업
if [ -f "$PYTHON_DIR/backup/stock_data_$(date +%Y-%m-%d).csv" ]; then
    mv "$PYTHON_DIR/backup/stock_data_$(date +%Y-%m-%d).csv" "$BACKUP_DIR/"
    echo "CSV 백업 완료" | tee -a "$LOG_FILE"
fi

# Excel 백업
if [ -f "$PYTHON_DIR/screening_results_$(date +%Y-%m-%d).xlsx" ]; then
    mv "$PYTHON_DIR/screening_results_$(date +%Y-%m-%d).xlsx" "$BACKUP_DIR/"
    echo "Excel 백업 완료" | tee -a "$LOG_FILE"
fi

# 4단계: 오래된 백업 삭제 (30일 이상)
echo "" | tee -a "$LOG_FILE"
echo "4단계: 오래된 백업 삭제 중..." | tee -a "$LOG_FILE"
find "$BACKUP_DIR" -name "*.csv" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.xlsx" -mtime +30 -delete
find "$LOG_DIR" -name "*.log" -mtime +30 -delete
echo "정리 완료" | tee -a "$LOG_FILE"

# 완료
END_TIME=$(date)
echo "" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"
echo "데이터 수집 완료: $END_TIME" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"

# 슬랙/이메일 알림 (선택사항)
# curl -X POST -H 'Content-type: application/json' \
#   --data "{\"text\":\"✅ 주식 데이터 수집 완료: $END_TIME\"}" \
#   YOUR_SLACK_WEBHOOK_URL

exit 0
