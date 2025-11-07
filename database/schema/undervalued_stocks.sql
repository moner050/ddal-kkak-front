-- ============================================================
-- 저평가 우량주 데이터베이스 스키마
-- ============================================================

-- 1. 주식 기본 정보 및 재무 데이터 테이블
CREATE TABLE IF NOT EXISTS undervalued_stocks (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL UNIQUE,

    -- 기본 정보
    name VARCHAR(255),
    sector VARCHAR(100),
    industry VARCHAR(100),

    -- 가격 및 거래량 데이터
    price DECIMAL(12, 2),
    market_cap DECIMAL(18, 2),  -- 시가총액 ($)
    dollar_volume DECIMAL(18, 2),  -- 일평균 거래대금 ($)

    -- 밸류에이션 지표
    pe_ratio DECIMAL(10, 2),  -- PER
    peg_ratio DECIMAL(10, 2),  -- PEG
    pb_ratio DECIMAL(10, 2),  -- PBR
    ps_ratio DECIMAL(10, 2),  -- PSR
    ev_ebitda DECIMAL(10, 2),  -- EV/EBITDA
    fcf_yield DECIMAL(8, 4),  -- 잉여현금흐름 수익률
    div_yield DECIMAL(8, 4),  -- 배당수익률
    payout_ratio DECIMAL(8, 4),  -- 배당성향

    -- 수익성 지표
    roe DECIMAL(8, 4),  -- 자기자본이익률
    roa DECIMAL(8, 4),  -- 총자산이익률
    op_margin_ttm DECIMAL(8, 4),  -- 영업이익률 (TTM)
    operating_margins DECIMAL(8, 4),  -- 영업이익률
    gross_margins DECIMAL(8, 4),  -- 매출총이익률
    net_margins DECIMAL(8, 4),  -- 순이익률

    -- 성장성 지표
    rev_yoy DECIMAL(8, 4),  -- 매출 성장률 (YoY)
    eps_growth_3y DECIMAL(8, 4),  -- EPS 3년 성장률
    revenue_growth_3y DECIMAL(8, 4),  -- 매출 3년 성장률
    ebitda_growth_3y DECIMAL(8, 4),  -- EBITDA 3년 성장률

    -- 기술적 지표
    sma_20 DECIMAL(12, 2),  -- 20일 이동평균
    sma_50 DECIMAL(12, 2),  -- 50일 이동평균
    sma_200 DECIMAL(12, 2),  -- 200일 이동평균
    rsi_14 DECIMAL(6, 2),  -- RSI (14일)
    macd DECIMAL(12, 4),  -- MACD
    macd_signal DECIMAL(12, 4),  -- MACD 시그널
    macd_histogram DECIMAL(12, 4),  -- MACD 히스토그램
    bb_position DECIMAL(6, 4),  -- 볼린저밴드 포지션 (0~1)
    atr_14 DECIMAL(12, 4),  -- ATR (14일)

    -- 모멘텀 지표
    ret_5 DECIMAL(8, 4),  -- 5일 수익률
    ret_20 DECIMAL(8, 4),  -- 20일 수익률
    ret_63 DECIMAL(8, 4),  -- 63일 (분기) 수익률
    momentum_12m DECIMAL(8, 4),  -- 12개월 모멘텀
    volatility_21d DECIMAL(8, 4),  -- 21일 변동성
    high_52w_ratio DECIMAL(6, 4),  -- 52주 고점 대비 비율
    low_52w_ratio DECIMAL(6, 4),  -- 52주 저점 대비 비율
    rvol DECIMAL(6, 2),  -- 상대 거래량

    -- 리스크 지표
    beta DECIMAL(6, 3),  -- 베타
    short_percent DECIMAL(6, 4),  -- 공매도 비율
    insider_ownership DECIMAL(6, 4),  -- 내부자 지분율
    institution_ownership DECIMAL(6, 4),  -- 기관 지분율

    -- 적정가치 및 할인율
    fair_value DECIMAL(12, 2),  -- 적정가치
    discount DECIMAL(8, 4),  -- 할인율 (음수면 저평가)

    -- 종합 점수
    growth_score DECIMAL(6, 2),  -- 성장성 점수
    quality_score DECIMAL(6, 2),  -- 우량성 점수
    value_score DECIMAL(6, 2),  -- 가치 점수
    momentum_score DECIMAL(6, 2),  -- 모멘텀 점수
    total_score DECIMAL(6, 2),  -- 종합 점수

    -- 스크리닝 프로필 (해당 종목이 통과한 전략들)
    passed_profiles TEXT[],  -- ['undervalued_quality', 'value_basic', ...]

    -- 메타데이터
    data_date DATE NOT NULL,  -- 데이터 수집 일자
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 인덱스
    CONSTRAINT unique_ticker_date UNIQUE (ticker, data_date)
);

-- 인덱스 생성
CREATE INDEX idx_undervalued_stocks_ticker ON undervalued_stocks(ticker);
CREATE INDEX idx_undervalued_stocks_data_date ON undervalued_stocks(data_date);
CREATE INDEX idx_undervalued_stocks_sector ON undervalued_stocks(sector);
CREATE INDEX idx_undervalued_stocks_total_score ON undervalued_stocks(total_score DESC);
CREATE INDEX idx_undervalued_stocks_market_cap ON undervalued_stocks(market_cap DESC);
CREATE INDEX idx_undervalued_stocks_passed_profiles ON undervalued_stocks USING GIN(passed_profiles);

-- 업데이트 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_undervalued_stocks_updated_at
    BEFORE UPDATE ON undervalued_stocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. 스크리닝 프로필 설정 테이블 (선택사항)
-- ============================================================
CREATE TABLE IF NOT EXISTS screening_profiles (
    id SERIAL PRIMARY KEY,
    profile_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    description TEXT,

    -- 필터 기준
    min_market_cap DECIMAL(18, 2),
    min_price DECIMAL(12, 2),
    min_dollar_volume DECIMAL(18, 2),
    max_pe DECIMAL(10, 2),
    max_peg DECIMAL(10, 2),
    min_rev_growth DECIMAL(8, 4),
    min_eps_growth DECIMAL(8, 4),
    min_op_margin DECIMAL(8, 4),
    min_roe DECIMAL(8, 4),
    min_fcf_yield DECIMAL(8, 4),
    min_div_yield DECIMAL(8, 4),

    -- 점수 가중치
    weight_growth DECIMAL(4, 2),
    weight_quality DECIMAL(4, 2),
    weight_value DECIMAL(4, 2),
    weight_momentum DECIMAL(4, 2),

    -- 메타데이터
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 프로필 데이터 삽입
INSERT INTO screening_profiles (profile_name, display_name, description, min_market_cap, min_price, max_pe, max_peg, min_rev_growth, min_eps_growth, min_op_margin, min_roe, min_fcf_yield, weight_growth, weight_quality, weight_value, weight_momentum)
VALUES
    ('undervalued_quality', '저평가 우량주', 'Warren Buffett 스타일 - 장기 투자용', 2000000000, 10.0, 25.0, 1.5, 0.05, 0.05, 0.12, 0.15, 0.03, 0.25, 0.35, 0.30, 0.10),
    ('value_basic', '가치주 (기본)', '기본적인 가치주 투자', 500000000, 5.0, 30.0, 2.0, -0.05, 0.0, 0.05, 0.08, 0.0, 0.15, 0.35, 0.40, 0.10),
    ('value_strict', '가치주 (엄격)', '엄격한 가치주 기준', 1000000000, 8.0, 20.0, 1.5, 0.0, 0.03, 0.10, 0.12, 0.02, 0.15, 0.40, 0.40, 0.05),
    ('growth_quality', '성장 우량주', '성장성과 우량성 중시', 1000000000, 10.0, 40.0, 2.5, 0.10, 0.10, 0.10, 0.12, 0.0, 0.45, 0.30, 0.15, 0.10),
    ('momentum', '모멘텀', '단기 모멘텀 트레이딩', 500000000, 5.0, 100.0, 5.0, -0.10, -0.10, 0.0, 0.0, 0.0, 0.05, 0.15, 0.20, 0.60),
    ('swing', '스윙', '스윙 트레이딩 (변동성 활용)', 300000000, 3.0, 100.0, 5.0, -0.20, -0.20, 0.0, 0.0, 0.0, 0.05, 0.10, 0.15, 0.70)
ON CONFLICT (profile_name) DO NOTHING;

-- ============================================================
-- 3. 데이터 수집 로그 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS data_collection_logs (
    id BIGSERIAL PRIMARY KEY,
    collection_date DATE NOT NULL,
    collection_start_time TIMESTAMP NOT NULL,
    collection_end_time TIMESTAMP,

    -- 통계
    total_tickers_attempted INTEGER,
    total_tickers_success INTEGER,
    total_tickers_failed INTEGER,

    -- 단계별 통계
    stage1_success INTEGER,  -- OHLCV 수집 성공
    stage1_failed INTEGER,
    stage2_success INTEGER,  -- 상세 데이터 수집 성공
    stage2_failed INTEGER,

    -- 오류 로그
    error_messages TEXT[],

    -- 상태
    status VARCHAR(20),  -- 'running', 'completed', 'failed'

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_collection_logs_date ON data_collection_logs(collection_date DESC);

-- ============================================================
-- 유용한 뷰
-- ============================================================

-- 1. 최신 데이터만 조회하는 뷰
CREATE OR REPLACE VIEW latest_undervalued_stocks AS
SELECT *
FROM undervalued_stocks
WHERE data_date = (SELECT MAX(data_date) FROM undervalued_stocks);

-- 2. 저평가 우량주 프로필 통과 종목만 조회
CREATE OR REPLACE VIEW undervalued_quality_stocks AS
SELECT *
FROM latest_undervalued_stocks
WHERE 'undervalued_quality' = ANY(passed_profiles)
ORDER BY total_score DESC;

-- 3. Top 종합 점수 상위 종목
CREATE OR REPLACE VIEW top_scored_stocks AS
SELECT *
FROM latest_undervalued_stocks
WHERE total_score IS NOT NULL
ORDER BY total_score DESC
LIMIT 100;

COMMENT ON TABLE undervalued_stocks IS '저평가 우량주 데이터 - Python 스크립트에서 수집한 미국 주식 데이터';
COMMENT ON COLUMN undervalued_stocks.ticker IS '티커 심볼 (예: AAPL)';
COMMENT ON COLUMN undervalued_stocks.fair_value IS '적정가치 - PE/PB/PEG/FCF 기반 계산';
COMMENT ON COLUMN undervalued_stocks.discount IS '할인율 - 음수면 저평가 (예: -0.20 = 20% 저평가)';
COMMENT ON COLUMN undervalued_stocks.passed_profiles IS '해당 종목이 통과한 스크리닝 프로필 목록';
