"""
데이터베이스 연결 및 설정 모듈
SQLAlchemy를 사용한 PostgreSQL 연결 관리
"""

import os
from datetime import date
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine, text, Column, Integer, String, Numeric, Date, DateTime, ARRAY, Boolean, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.sql import func
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base 클래스
Base = declarative_base()


# ============================================================
# 데이터베이스 모델 (SQLAlchemy ORM)
# ============================================================

class UndervaluedStock(Base):
    """저평가 우량주 테이블 모델"""
    __tablename__ = 'undervalued_stocks'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ticker = Column(String(20), nullable=False)

    # 기본 정보
    name = Column(String(255))
    sector = Column(String(100))
    industry = Column(String(100))

    # 가격 및 거래량
    price = Column(Numeric(12, 2))
    market_cap = Column(Numeric(18, 2))
    dollar_volume = Column(Numeric(18, 2))

    # 밸류에이션
    pe_ratio = Column(Numeric(10, 2))
    peg_ratio = Column(Numeric(10, 2))
    pb_ratio = Column(Numeric(10, 2))
    ps_ratio = Column(Numeric(10, 2))
    ev_ebitda = Column(Numeric(10, 2))
    fcf_yield = Column(Numeric(8, 4))
    div_yield = Column(Numeric(8, 4))
    payout_ratio = Column(Numeric(8, 4))

    # 수익성
    roe = Column(Numeric(8, 4))
    roa = Column(Numeric(8, 4))
    op_margin_ttm = Column(Numeric(8, 4))
    operating_margins = Column(Numeric(8, 4))
    gross_margins = Column(Numeric(8, 4))
    net_margins = Column(Numeric(8, 4))

    # 성장성
    rev_yoy = Column(Numeric(8, 4))
    eps_growth_3y = Column(Numeric(8, 4))
    revenue_growth_3y = Column(Numeric(8, 4))
    ebitda_growth_3y = Column(Numeric(8, 4))

    # 기술적 지표
    sma_20 = Column(Numeric(12, 2))
    sma_50 = Column(Numeric(12, 2))
    sma_200 = Column(Numeric(12, 2))
    rsi_14 = Column(Numeric(6, 2))
    macd = Column(Numeric(12, 4))
    macd_signal = Column(Numeric(12, 4))
    macd_histogram = Column(Numeric(12, 4))
    bb_position = Column(Numeric(6, 4))
    atr_14 = Column(Numeric(12, 4))

    # 모멘텀
    ret_5 = Column(Numeric(8, 4))
    ret_20 = Column(Numeric(8, 4))
    ret_63 = Column(Numeric(8, 4))
    momentum_12m = Column(Numeric(8, 4))
    volatility_21d = Column(Numeric(8, 4))
    high_52w_ratio = Column(Numeric(6, 4))
    low_52w_ratio = Column(Numeric(6, 4))
    rvol = Column(Numeric(6, 2))

    # 리스크
    beta = Column(Numeric(6, 3))
    short_percent = Column(Numeric(6, 4))
    insider_ownership = Column(Numeric(6, 4))
    institution_ownership = Column(Numeric(6, 4))

    # 적정가치
    fair_value = Column(Numeric(12, 2))
    discount = Column(Numeric(8, 4))

    # 점수
    growth_score = Column(Numeric(6, 2))
    quality_score = Column(Numeric(6, 2))
    value_score = Column(Numeric(6, 2))
    momentum_score = Column(Numeric(6, 2))
    total_score = Column(Numeric(6, 2))

    # 스크리닝 프로필
    passed_profiles = Column(ARRAY(String))

    # 메타데이터
    data_date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class DataCollectionLog(Base):
    """데이터 수집 로그 테이블 모델"""
    __tablename__ = 'data_collection_logs'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    collection_date = Column(Date, nullable=False)
    collection_start_time = Column(DateTime, nullable=False)
    collection_end_time = Column(DateTime)

    total_tickers_attempted = Column(Integer)
    total_tickers_success = Column(Integer)
    total_tickers_failed = Column(Integer)

    stage1_success = Column(Integer)
    stage1_failed = Column(Integer)
    stage2_success = Column(Integer)
    stage2_failed = Column(Integer)

    error_messages = Column(ARRAY(String))
    status = Column(String(20))

    created_at = Column(DateTime, server_default=func.now())


# ============================================================
# 데이터베이스 연결 관리
# ============================================================

class DatabaseManager:
    """데이터베이스 연결 및 작업 관리 클래스"""

    def __init__(self, connection_string: Optional[str] = None):
        """
        데이터베이스 매니저 초기화

        Args:
            connection_string: PostgreSQL 연결 문자열 (없으면 환경변수에서 읽음)
        """
        if connection_string is None:
            connection_string = self._get_connection_string_from_env()

        self.engine = create_engine(
            connection_string,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,  # 연결 유효성 체크
            echo=False  # SQL 로그 출력 (개발시에는 True)
        )

        self.SessionLocal = sessionmaker(bind=self.engine)
        logger.info("✅ 데이터베이스 연결 성공")

    @staticmethod
    def _get_connection_string_from_env() -> str:
        """환경변수에서 데이터베이스 연결 정보 읽기"""
        host = os.getenv('DB_HOST', 'localhost')
        port = os.getenv('DB_PORT', '5432')
        database = os.getenv('DB_NAME', 'ddal_kkak')
        user = os.getenv('DB_USER', 'postgres')
        password = os.getenv('DB_PASSWORD', 'postgres')

        return f"postgresql://{user}:{password}@{host}:{port}/{database}"

    def create_tables(self):
        """테이블 생성 (없으면)"""
        Base.metadata.create_all(self.engine)
        logger.info("✅ 테이블 생성 완료")

    def get_session(self) -> Session:
        """세션 가져오기"""
        return self.SessionLocal()

    def bulk_upsert_stocks(
        self,
        stock_data: List[Dict[str, Any]],
        data_date: date
    ) -> int:
        """
        주식 데이터 대량 삽입/업데이트 (UPSERT)

        Args:
            stock_data: 삽입할 주식 데이터 리스트
            data_date: 데이터 수집 날짜

        Returns:
            삽입/업데이트된 레코드 수
        """
        session = self.get_session()
        try:
            # 각 레코드에 data_date 추가
            for record in stock_data:
                record['data_date'] = data_date

            # PostgreSQL UPSERT (ON CONFLICT DO UPDATE)
            stmt = insert(UndervaluedStock).values(stock_data)

            # 충돌시 업데이트 (ticker와 data_date가 동일한 경우)
            update_dict = {
                col.name: stmt.excluded[col.name]
                for col in UndervaluedStock.__table__.columns
                if col.name not in ['id', 'created_at']
            }

            stmt = stmt.on_conflict_do_update(
                index_elements=['ticker', 'data_date'],
                set_=update_dict
            )

            result = session.execute(stmt)
            session.commit()

            count = len(stock_data)
            logger.info(f"✅ {count}개 레코드 삽입/업데이트 완료")
            return count

        except Exception as e:
            session.rollback()
            logger.error(f"❌ 데이터 삽입 실패: {str(e)}")
            raise
        finally:
            session.close()

    def insert_collection_log(
        self,
        collection_date: date,
        start_time,
        end_time,
        stats: Dict[str, Any]
    ) -> int:
        """
        데이터 수집 로그 삽입

        Args:
            collection_date: 수집 날짜
            start_time: 시작 시간
            end_time: 종료 시간
            stats: 통계 정보 딕셔너리

        Returns:
            로그 ID
        """
        session = self.get_session()
        try:
            log = DataCollectionLog(
                collection_date=collection_date,
                collection_start_time=start_time,
                collection_end_time=end_time,
                total_tickers_attempted=stats.get('total_attempted', 0),
                total_tickers_success=stats.get('total_success', 0),
                total_tickers_failed=stats.get('total_failed', 0),
                stage1_success=stats.get('stage1_success', 0),
                stage1_failed=stats.get('stage1_failed', 0),
                stage2_success=stats.get('stage2_success', 0),
                stage2_failed=stats.get('stage2_failed', 0),
                error_messages=stats.get('errors', []),
                status=stats.get('status', 'completed')
            )

            session.add(log)
            session.commit()
            log_id = log.id

            logger.info(f"✅ 수집 로그 저장 완료 (ID: {log_id})")
            return log_id

        except Exception as e:
            session.rollback()
            logger.error(f"❌ 로그 저장 실패: {str(e)}")
            raise
        finally:
            session.close()

    def get_latest_data_date(self) -> Optional[date]:
        """가장 최근 데이터 날짜 조회"""
        session = self.get_session()
        try:
            result = session.query(func.max(UndervaluedStock.data_date)).scalar()
            return result
        finally:
            session.close()

    def get_stocks_by_profile(
        self,
        profile_name: str,
        data_date: Optional[date] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        특정 프로필을 통과한 종목 조회

        Args:
            profile_name: 프로필 이름 (예: 'undervalued_quality')
            data_date: 조회할 날짜 (None이면 최신)
            limit: 최대 조회 개수

        Returns:
            종목 데이터 리스트
        """
        session = self.get_session()
        try:
            query = session.query(UndervaluedStock)

            # 날짜 필터
            if data_date is None:
                data_date = self.get_latest_data_date()

            if data_date:
                query = query.filter(UndervaluedStock.data_date == data_date)

            # 프로필 필터 (PostgreSQL ARRAY 검색)
            query = query.filter(
                UndervaluedStock.passed_profiles.any(profile_name)
            )

            # 점수 순 정렬
            query = query.order_by(UndervaluedStock.total_score.desc())

            # 제한
            query = query.limit(limit)

            # 결과를 딕셔너리 리스트로 변환
            results = []
            for stock in query.all():
                stock_dict = {
                    column.name: getattr(stock, column.name)
                    for column in stock.__table__.columns
                }
                results.append(stock_dict)

            return results

        finally:
            session.close()

    def cleanup_old_data(self, keep_days: int = 90):
        """
        오래된 데이터 삭제 (보관 기간 초과)

        Args:
            keep_days: 보관할 일수
        """
        session = self.get_session()
        try:
            cutoff_date = date.today() - timedelta(days=keep_days)

            deleted = session.query(UndervaluedStock).filter(
                UndervaluedStock.data_date < cutoff_date
            ).delete()

            session.commit()
            logger.info(f"✅ {deleted}개의 오래된 레코드 삭제 완료 (기준일: {cutoff_date})")

        except Exception as e:
            session.rollback()
            logger.error(f"❌ 데이터 정리 실패: {str(e)}")
            raise
        finally:
            session.close()


# ============================================================
# 사용 예시
# ============================================================

if __name__ == "__main__":
    from datetime import datetime, timedelta

    # 1. 데이터베이스 매니저 생성
    db = DatabaseManager()

    # 2. 테이블 생성
    db.create_tables()

    # 3. 샘플 데이터 삽입
    sample_data = [
        {
            'ticker': 'AAPL',
            'name': 'Apple Inc.',
            'sector': 'Technology',
            'industry': 'Consumer Electronics',
            'price': 175.50,
            'market_cap': 2800000000000,
            'pe_ratio': 28.5,
            'roe': 0.45,
            'total_score': 85.5,
            'passed_profiles': ['undervalued_quality', 'growth_quality']
        }
    ]

    # 4. UPSERT 실행
    count = db.bulk_upsert_stocks(sample_data, date.today())
    print(f"삽입된 레코드: {count}개")

    # 5. 데이터 조회
    stocks = db.get_stocks_by_profile('undervalued_quality', limit=10)
    print(f"조회된 종목: {len(stocks)}개")

    # 6. 수집 로그 저장
    stats = {
        'total_attempted': 100,
        'total_success': 95,
        'total_failed': 5,
        'stage1_success': 100,
        'stage1_failed': 0,
        'stage2_success': 95,
        'stage2_failed': 5,
        'status': 'completed'
    }
    log_id = db.insert_collection_log(
        collection_date=date.today(),
        start_time=datetime.now(),
        end_time=datetime.now(),
        stats=stats
    )
    print(f"로그 ID: {log_id}")
