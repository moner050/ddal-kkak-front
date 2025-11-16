#!/bin/bash

# ============================================================
# Cron Job 설정 스크립트
# 매일 오전 7시에 데이터 수집 실행하도록 설정
# ============================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
COLLECTION_SCRIPT="$SCRIPT_DIR/run_data_collection.sh"

echo "============================================================"
echo "Cron Job 설정"
echo "============================================================"

# 실행 권한 부여
chmod +x "$COLLECTION_SCRIPT"
echo "✅ 실행 권한 부여: $COLLECTION_SCRIPT"

# 현재 crontab 백업
crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null || true
echo "✅ 현재 crontab 백업 완료"

# 새로운 cron job 추가 (중복 체크)
CRON_JOB="0 7 * * * $COLLECTION_SCRIPT >> $SCRIPT_DIR/../logs/cron.log 2>&1"

# 기존 crontab 가져오기
CURRENT_CRONTAB=$(crontab -l 2>/dev/null || echo "")

# 이미 등록되어 있는지 확인
if echo "$CURRENT_CRONTAB" | grep -q "$COLLECTION_SCRIPT"; then
    echo "⚠️  이미 등록된 cron job이 있습니다."
    echo ""
    echo "현재 등록된 작업:"
    echo "$CURRENT_CRONTAB" | grep "$COLLECTION_SCRIPT"
    echo ""
    read -p "기존 작업을 삭제하고 새로 등록하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 기존 작업 삭제
        UPDATED_CRONTAB=$(echo "$CURRENT_CRONTAB" | grep -v "$COLLECTION_SCRIPT")
        echo "$UPDATED_CRONTAB" | crontab -
        echo "✅ 기존 작업 삭제 완료"
    else
        echo "취소되었습니다."
        exit 0
    fi
fi

# 새 작업 추가
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
echo "✅ Cron job 등록 완료"

echo ""
echo "============================================================"
echo "설정된 Cron Job:"
echo "============================================================"
crontab -l | grep "$COLLECTION_SCRIPT"

echo ""
echo "============================================================"
echo "실행 스케줄: 매일 오전 7시"
echo "스크립트: $COLLECTION_SCRIPT"
echo "로그 파일: $SCRIPT_DIR/../logs/cron.log"
echo "============================================================"

echo ""
echo "테스트 실행 (선택사항):"
echo "  $COLLECTION_SCRIPT"
echo ""
echo "Cron job 확인:"
echo "  crontab -l"
echo ""
echo "Cron job 삭제:"
echo "  crontab -e  # 편집기로 수동 삭제"
echo "============================================================"
