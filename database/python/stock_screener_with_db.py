"""
주식 스크리닝 및 점수 계산 스크립트 (데이터베이스 통합 버전)
기존 improved_stock_screener.py를 DB 연동으로 수정

사용법:
    python stock_screener_with_db.py --profile undervalued_quality --date 2025-11-07
"""

import argparse
from datetime import date, datetime
from typing import List, Dict, Any, Optional
import pandas as pd
import logging

# 기존 스크립트에서 필요한 클래스들 import
from improved_stock_screener import (
    FilterCriteria,
    ScreenerConfig,
    DataProcessor,
    ValuationModel,
    StockScreener
)

# 데이터베이스 매니저 import
from db_config import DatabaseManager, UndervaluedStock

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)


def load_data_from_db(db: DatabaseManager, target_date: Optional[date] = None) -> pd.DataFrame:
    """
    데이터베이스에서 주식 데이터 로드

    Args:
        db: 데이터베이스 매니저
        target_date: 조회할 날짜 (None이면 최신 데이터)

    Returns:
        주식 데이터 DataFrame
    """
    logger.info("📊 데이터베이스에서 데이터 로드 중...")

    if target_date is None:
        target_date = db.get_latest_data_date()

    if target_date is None:
        raise ValueError("데이터베이스에 데이터가 없습니다")

    session = db.get_session()
    try:
        # 특정 날짜의 모든 데이터 조회
        query = session.query(UndervaluedStock).filter(
            UndervaluedStock.data_date == target_date
        )

        stocks = query.all()

        if not stocks:
            raise ValueError(f"{target_date} 날짜의 데이터가 없습니다")

        # DataFrame으로 변환
        data = []
        for stock in stocks:
            stock_dict = {
                column.name: getattr(stock, column.name)
                for column in stock.__table__.columns
            }
            data.append(stock_dict)

        df = pd.DataFrame(data)

        # CSV 컬럼명으로 변환 (기존 스크리너 코드와 호환을 위해)
        df = df.rename(columns={
            'ticker': 'Ticker',
            'name': 'Name',
            'sector': 'Sector',
            'industry': 'Industry',
            'price': 'Price',
            'market_cap': 'MktCap',
            'dollar_volume': 'DollarVol',
            'pe_ratio': 'PE',
            'peg_ratio': 'PEG',
            'pb_ratio': 'PB',
            'ps_ratio': 'PS',
            'ev_ebitda': 'EV_EBITDA',
            'fcf_yield': 'FCF_Yield',
            'div_yield': 'DivYield',
            'payout_ratio': 'PayoutRatio',
            'roe': 'ROE',
            'roa': 'ROA',
            'op_margin_ttm': 'OpMarginTTM',
            'operating_margins': 'OperatingMargins',
            'gross_margins': 'GrossMargins',
            'net_margins': 'NetMargins',
            'rev_yoy': 'RevYoY',
            'eps_growth_3y': 'EPS_Growth_3Y',
            'revenue_growth_3y': 'Revenue_Growth_3Y',
            'ebitda_growth_3y': 'EBITDA_Growth_3Y',
            'rsi_14': 'RSI_14',
            'ret_5': 'RET5',
            'ret_20': 'RET20',
            'ret_63': 'RET63',
            'rvol': 'RVOL',
            'beta': 'Beta',
            'macd': 'MACD',
        })

        # MktCap과 DollarVol을 Million 단위로 변환 (기존 코드 호환)
        df['MktCap'] = df['MktCap'] / 1_000_000
        df['DollarVol'] = df['DollarVol'] / 1_000_000

        logger.info(f"✅ {len(df)}개 종목 데이터 로드 완료 (날짜: {target_date})")
        return df

    finally:
        session.close()


def update_screening_results_to_db(
    db: DatabaseManager,
    df: pd.DataFrame,
    target_date: date
):
    """
    스크리닝 결과를 데이터베이스에 업데이트

    Args:
        db: 데이터베이스 매니저
        df: 스크리닝 결과 DataFrame (FairValue, Discount, Scores, passed_profiles 포함)
        target_date: 데이터 날짜
    """
    logger.info("💾 스크리닝 결과를 데이터베이스에 업데이트 중...")

    session = db.get_session()
    try:
        update_count = 0

        for _, row in df.iterrows():
            ticker = row['Ticker']

            # 업데이트할 데이터 준비
            update_data = {}

            # 적정가치 및 할인율
            if 'FairValue' in row and pd.notna(row['FairValue']):
                update_data['fair_value'] = float(row['FairValue'])
            if 'Discount' in row and pd.notna(row['Discount']):
                update_data['discount'] = float(row['Discount'])

            # 점수들
            if 'GrowthScore' in row and pd.notna(row['GrowthScore']):
                update_data['growth_score'] = float(row['GrowthScore'])
            if 'QualityScore' in row and pd.notna(row['QualityScore']):
                update_data['quality_score'] = float(row['QualityScore'])
            if 'ValueScore' in row and pd.notna(row['ValueScore']):
                update_data['value_score'] = float(row['ValueScore'])
            if 'MomentumScore' in row and pd.notna(row['MomentumScore']):
                update_data['momentum_score'] = float(row['MomentumScore'])
            if 'TotalScore' in row and pd.notna(row['TotalScore']):
                update_data['total_score'] = float(row['TotalScore'])

            # 통과한 프로필들
            if 'passed_profiles' in row and row['passed_profiles']:
                if isinstance(row['passed_profiles'], list):
                    update_data['passed_profiles'] = row['passed_profiles']
                elif isinstance(row['passed_profiles'], str):
                    update_data['passed_profiles'] = [row['passed_profiles']]

            # 업데이트 실행
            if update_data:
                session.query(UndervaluedStock).filter(
                    UndervaluedStock.ticker == ticker,
                    UndervaluedStock.data_date == target_date
                ).update(update_data)

                update_count += 1

                # 100개마다 커밋
                if update_count % 100 == 0:
                    session.commit()
                    logger.info(f"진행 중: {update_count}개 업데이트...")

        # 최종 커밋
        session.commit()
        logger.info(f"✅ {update_count}개 종목 업데이트 완료")

    except Exception as e:
        session.rollback()
        logger.error(f"❌ 업데이트 실패: {str(e)}")
        raise
    finally:
        session.close()


def run_screening_for_profile(
    df: pd.DataFrame,
    profile_name: str,
    screener: StockScreener
) -> pd.DataFrame:
    """
    특정 프로필에 대해 스크리닝 실행

    Args:
        df: 입력 데이터 DataFrame
        profile_name: 프로필 이름
        screener: StockScreener 인스턴스

    Returns:
        필터링 및 점수 계산된 DataFrame
    """
    logger.info(f"🔍 '{profile_name}' 프로필 스크리닝 시작...")

    # 1. 필터 적용
    filtered_df = screener.apply_filters(df, profile_name)

    if filtered_df.empty:
        logger.warning(f"⚠️  '{profile_name}': 필터 통과 종목 없음")
        return pd.DataFrame()

    # 2. 적정가치 계산 (아직 계산되지 않은 경우)
    if 'FairValue' not in filtered_df.columns:
        filtered_df = ValuationModel.calculate_fair_value(filtered_df)

    # 3. 점수 계산
    # 프로필별 점수 타입 매핑
    score_type_map = {
        'undervalued_quality': 'balanced',
        'value_basic': 'value',
        'value_strict': 'value',
        'growth_quality': 'growth',
        'momentum': 'trading',
        'swing': 'trading'
    }
    score_type = score_type_map.get(profile_name, 'balanced')

    filtered_df = screener.calculate_scores(filtered_df, score_type=score_type)

    # 4. 정렬
    filtered_df = filtered_df.sort_values('TotalScore', ascending=False)

    # 5. passed_profiles 컬럼 추가
    filtered_df['passed_profiles'] = [[profile_name]] * len(filtered_df)

    logger.info(f"✅ '{profile_name}': {len(filtered_df)}개 종목 통과")

    return filtered_df


def merge_all_profiles_results(profile_results: Dict[str, pd.DataFrame]) -> pd.DataFrame:
    """
    모든 프로필 결과를 병합하여 passed_profiles 통합

    Args:
        profile_results: {profile_name: DataFrame} 딕셔너리

    Returns:
        통합된 DataFrame (각 종목이 통과한 모든 프로필 정보 포함)
    """
    logger.info("🔄 프로필 결과 병합 중...")

    # 모든 종목 수집
    all_tickers = set()
    for df in profile_results.values():
        all_tickers.update(df['Ticker'].tolist())

    # 종목별로 데이터 병합
    merged_data = {}

    for ticker in all_tickers:
        ticker_data = None
        passed_profiles = []

        for profile_name, df in profile_results.items():
            ticker_rows = df[df['Ticker'] == ticker]

            if not ticker_rows.empty:
                # 첫 번째 매치를 기준 데이터로 사용
                if ticker_data is None:
                    ticker_data = ticker_rows.iloc[0].to_dict()
                passed_profiles.append(profile_name)

        if ticker_data:
            ticker_data['passed_profiles'] = passed_profiles
            merged_data[ticker] = ticker_data

    # DataFrame으로 변환
    merged_df = pd.DataFrame(list(merged_data.values()))

    logger.info(f"✅ {len(merged_df)}개 종목 병합 완료")
    return merged_df


def main():
    """메인 실행 함수"""
    parser = argparse.ArgumentParser(description='주식 스크리닝 (DB 통합)')
    parser.add_argument('--profile', type=str, default='all',
                        help='스크리닝 프로필 (all, undervalued_quality, value_basic, ...)')
    parser.add_argument('--date', type=str, default=None,
                        help='데이터 날짜 (YYYY-MM-DD, 기본값: 최신)')
    parser.add_argument('--export-excel', action='store_true',
                        help='Excel 파일로 결과 내보내기')

    args = parser.parse_args()

    start_time = datetime.now()
    logger.info("=" * 60)
    logger.info("🚀 주식 스크리닝 시작 (데이터베이스 통합 버전)")
    logger.info("=" * 60)

    try:
        # 1. 데이터베이스 연결
        db = DatabaseManager()

        # 2. 날짜 파싱
        target_date = None
        if args.date:
            target_date = datetime.strptime(args.date, '%Y-%m-%d').date()

        # 3. 데이터 로드
        df = load_data_from_db(db, target_date)
        actual_date = target_date or db.get_latest_data_date()

        # 4. 스크리너 초기화
        screener = StockScreener()

        # 5. 프로필 선택
        if args.profile == 'all':
            profiles_to_run = list(ScreenerConfig.PROFILES.keys())
        else:
            if args.profile not in ScreenerConfig.PROFILES:
                raise ValueError(f"알 수 없는 프로필: {args.profile}")
            profiles_to_run = [args.profile]

        logger.info(f"📋 실행할 프로필: {', '.join(profiles_to_run)}")

        # 6. 각 프로필별 스크리닝 실행
        profile_results = {}

        for profile_name in profiles_to_run:
            result_df = run_screening_for_profile(df, profile_name, screener)
            if not result_df.empty:
                profile_results[profile_name] = result_df

        # 7. 결과 병합
        if profile_results:
            merged_df = merge_all_profiles_results(profile_results)

            # 8. 데이터베이스 업데이트
            update_screening_results_to_db(db, merged_df, actual_date)

            # 9. (선택사항) Excel 내보내기
            if args.export_excel:
                from improved_stock_screener import ExcelExporter
                excel_path = f"screening_results_{actual_date}.xlsx"
                exporter = ExcelExporter(excel_path)

                for profile_name, result_df in profile_results.items():
                    exporter.export_to_sheet(result_df, profile_name)

                logger.info(f"📊 Excel 파일 저장: {excel_path}")

        else:
            logger.warning("⚠️  필터를 통과한 종목이 없습니다")

        # 10. 완료 메시지
        duration = (datetime.now() - start_time).total_seconds()
        logger.info("=" * 60)
        logger.info("✅ 스크리닝 완료!")
        logger.info(f"📊 소요 시간: {duration:.2f}초")
        logger.info(f"📅 데이터 날짜: {actual_date}")

        # 프로필별 통계
        for profile_name, result_df in profile_results.items():
            logger.info(f"  - {profile_name}: {len(result_df)}개 종목")

        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"❌ 오류 발생: {str(e)}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
