"""
주식 데이터 수집 스크립트 (데이터베이스 통합 버전)
기존 build_details_cache_fully_optimized.py를 DB 연동으로 수정

사용법:
    python data_collector_with_db.py
"""

import sys
import pandas as pd
from datetime import datetime, date
from typing import List, Dict, Any
import logging

# 기존 스크립트에서 필요한 함수들 import
# (여기서는 예시로 간략화했지만, 실제로는 기존 함수들을 그대로 사용)
from build_details_cache_fully_optimized import (
    fetch_universe,
    preload_ohlcv_light,
    fetch_enhanced_details_for_ticker,
    # ... 기타 필요한 함수들
)

# 데이터베이스 매니저 import
from db_config import DatabaseManager

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)


# ============================================================
# 컬럼명 매핑 (CSV → DB)
# ============================================================

COLUMN_MAPPING = {
    # CSV 컬럼명 → DB 컬럼명
    'Ticker': 'ticker',
    'Name': 'name',
    'Sector': 'sector',
    'Industry': 'industry',
    'Price': 'price',
    'MktCap($M)': 'market_cap',
    'DollarVol($M)': 'dollar_volume',

    # 밸류에이션
    'PE': 'pe_ratio',
    'PEG': 'peg_ratio',
    'PB': 'pb_ratio',
    'PS': 'ps_ratio',
    'EV_EBITDA': 'ev_ebitda',
    'FCF_Yield': 'fcf_yield',
    'DivYield': 'div_yield',
    'PayoutRatio': 'payout_ratio',

    # 수익성
    'ROE': 'roe',
    'ROA': 'roa',
    'OpMarginTTM': 'op_margin_ttm',
    'OperatingMargins': 'operating_margins',
    'GrossMargins': 'gross_margins',
    'NetMargins': 'net_margins',

    # 성장성
    'RevYoY': 'rev_yoy',
    'EPS_Growth_3Y': 'eps_growth_3y',
    'Revenue_Growth_3Y': 'revenue_growth_3y',
    'EBITDA_Growth_3Y': 'ebitda_growth_3y',

    # 기술적 지표
    'SMA20': 'sma_20',
    'SMA50': 'sma_50',
    'SMA200': 'sma_200',
    'RSI_14': 'rsi_14',
    'MACD': 'macd',
    'MACD_Signal': 'macd_signal',
    'MACD_Histogram': 'macd_histogram',
    'BB_Position': 'bb_position',
    'ATR_14': 'atr_14',

    # 모멘텀
    'RET5': 'ret_5',
    'RET20': 'ret_20',
    'RET63': 'ret_63',
    'Momentum_12M': 'momentum_12m',
    'Volatility_21D': 'volatility_21d',
    'High_52W_Ratio': 'high_52w_ratio',
    'Low_52W_Ratio': 'low_52w_ratio',
    'RVOL': 'rvol',

    # 리스크
    'Beta': 'beta',
    'ShortPercent': 'short_percent',
    'InsiderOwnership': 'insider_ownership',
    'InstitutionOwnership': 'institution_ownership',
}


def convert_dataframe_to_db_format(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    DataFrame을 데이터베이스 삽입용 딕셔너리 리스트로 변환

    Args:
        df: 수집된 데이터 DataFrame

    Returns:
        데이터베이스 삽입용 딕셔너리 리스트
    """
    records = []

    for _, row in df.iterrows():
        record = {}

        # 컬럼명 매핑 및 데이터 변환
        for csv_col, db_col in COLUMN_MAPPING.items():
            if csv_col in row:
                value = row[csv_col]

                # None, NaN 처리
                if pd.isna(value) or value is None:
                    record[db_col] = None
                    continue

                # 타입별 변환
                if db_col in ['market_cap', 'dollar_volume']:
                    # Million 단위를 Dollar 단위로 변환
                    record[db_col] = float(value) * 1_000_000 if value else None
                elif isinstance(value, (int, float)):
                    record[db_col] = float(value)
                else:
                    record[db_col] = str(value)

        # 필수 필드 검증
        if record.get('ticker'):
            records.append(record)

    return records


def main():
    """메인 실행 함수"""
    start_time = datetime.now()
    logger.info("=" * 60)
    logger.info("🚀 주식 데이터 수집 시작 (데이터베이스 통합 버전)")
    logger.info("=" * 60)

    # 통계 초기화
    stats = {
        'total_attempted': 0,
        'total_success': 0,
        'total_failed': 0,
        'stage1_success': 0,
        'stage1_failed': 0,
        'stage2_success': 0,
        'stage2_failed': 0,
        'errors': [],
        'status': 'running'
    }

    try:
        # 1. 데이터베이스 매니저 초기화
        logger.info("📊 데이터베이스 연결 중...")
        db = DatabaseManager()
        db.create_tables()  # 테이블이 없으면 생성

        # 2. 기존 데이터 수집 로직 실행
        logger.info("📈 Stage 1: OHLCV 데이터 수집 중...")

        # Universe 가져오기 (기존 함수 사용)
        universe_df = fetch_universe()
        stats['total_attempted'] = len(universe_df)

        # OHLCV 데이터 수집 (기존 함수 사용)
        df_light = preload_ohlcv_light(universe_df)
        stats['stage1_success'] = len(df_light)
        stats['stage1_failed'] = stats['total_attempted'] - stats['stage1_success']

        logger.info(f"✅ Stage 1 완료: {stats['stage1_success']}개 성공, {stats['stage1_failed']}개 실패")

        # 3. Stage 2: 상세 데이터 수집
        logger.info("📊 Stage 2: 상세 데이터 수집 중...")

        # 상위 종목만 선택 (기존 로직)
        df_light_sorted = df_light.sort_values('DollarVol($M)', ascending=False)
        top_k = min(12000, len(df_light_sorted))
        df_selected = df_light_sorted.head(top_k)

        # 병렬 데이터 수집 (기존 함수 사용)
        from concurrent.futures import ThreadPoolExecutor, as_completed

        detailed_records = []
        errors_stage2 = []

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                executor.submit(
                    fetch_enhanced_details_for_ticker,
                    row['Ticker'],
                    price=row['Price'],
                    avg_vol=(row['DollarVol($M)'] * 1_000_000) / max(1e-9, row['Price'])
                ): row['Ticker']
                for _, row in df_selected.iterrows()
            }

            for future in as_completed(futures):
                ticker = futures[future]
                try:
                    record = future.result()
                    if record:
                        detailed_records.append(record)
                        stats['stage2_success'] += 1
                except Exception as e:
                    error_msg = f"종목 {ticker} 수집 실패: {str(e)}"
                    errors_stage2.append(error_msg)
                    stats['stage2_failed'] += 1

        logger.info(f"✅ Stage 2 완료: {stats['stage2_success']}개 성공, {stats['stage2_failed']}개 실패")

        # 4. DataFrame 생성
        df_final = pd.DataFrame(detailed_records)

        if df_final.empty:
            raise ValueError("수집된 데이터가 없습니다")

        # 5. 데이터베이스 삽입 형식으로 변환
        logger.info("🔄 데이터 변환 중...")
        db_records = convert_dataframe_to_db_format(df_final)

        # 6. 데이터베이스에 삽입
        logger.info(f"💾 데이터베이스에 {len(db_records)}개 레코드 삽입 중...")
        collection_date = date.today()
        inserted_count = db.bulk_upsert_stocks(db_records, collection_date)

        stats['total_success'] = inserted_count
        stats['status'] = 'completed'

        logger.info(f"✅ 데이터베이스 삽입 완료: {inserted_count}개")

        # 7. 수집 로그 저장
        end_time = datetime.now()
        stats['errors'] = errors_stage2[:100]  # 최대 100개까지만 저장

        log_id = db.insert_collection_log(
            collection_date=collection_date,
            start_time=start_time,
            end_time=end_time,
            stats=stats
        )

        # 8. 완료 메시지
        duration = (end_time - start_time).total_seconds()
        logger.info("=" * 60)
        logger.info("✅ 데이터 수집 완료!")
        logger.info(f"📊 총 소요 시간: {duration:.2f}초")
        logger.info(f"📈 수집 성공: {stats['total_success']}개")
        logger.info(f"❌ 수집 실패: {stats['total_failed']}개")
        logger.info(f"📝 로그 ID: {log_id}")
        logger.info(f"📅 데이터 날짜: {collection_date}")
        logger.info("=" * 60)

        # (선택사항) 백업용 CSV 저장
        csv_path = f"backup/stock_data_{collection_date}.csv"
        df_final.to_csv(csv_path, index=False, encoding='utf-8-sig')
        logger.info(f"💾 백업 CSV 저장: {csv_path}")

    except Exception as e:
        logger.error(f"❌ 치명적 오류 발생: {str(e)}", exc_info=True)
        stats['status'] = 'failed'
        stats['errors'].append(str(e))

        # 실패 로그도 저장
        try:
            db.insert_collection_log(
                collection_date=date.today(),
                start_time=start_time,
                end_time=datetime.now(),
                stats=stats
            )
        except Exception as log_error:
            logger.error(f"로그 저장 실패: {str(log_error)}")

        sys.exit(1)


if __name__ == "__main__":
    main()
